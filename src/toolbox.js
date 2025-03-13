/* block-def.ne
@{%
const moo = require("moo");

const lexer = moo.compile({
    varName:       /[_a-zA-Z][_$a-zA-Z0-9]* /,
    roundDefault:  /(?:\$[_a-zA-Z][_$a-zA-Z0-9]*[ \t\v\f]+)?(?:[^)\n]|\\\))+/,
    squareDefault: /(?:\$[_a-zA-Z][_$a-zA-Z0-9]*[ \t\v\f]+)?(?:[^\]\n]|\\\])+/,
    iconURL:       /[^\n]+/
});
%}

@lexer lexer
@builtin "whitespace.ne"

main -> (
    iconDefinition | 
    listDefinition | 
    category _ ((iconDefinition | listDefinition | block | _) _):*
):*

number ->    "(" _ %roundDefault:? _ ")"
degrees ->   "(" _ "@" _ %roundDefault:? _ ")"
writeable -> "(" _ [vV^] _ %varName _ %roundDefault:? _ ")"
string ->    "[" _ %squareDefault:? _ "]"
list ->      "[" _ [vV^] _ %varName _ %squareDefault:? _ "]"
collapse ->  "[" _ [<>] _ argument:* _ "]"
boolean ->   "<" _ ">"
stack ->     "{" _ "}"
icon ->      "@" _ %varName

argument -> number | writeable | string | list | degrees | .:+
block -> _ [{\[(<]:? _ argument:* _ [>)\]}]:? "::" (_ [^\s]:*):* _ [>)\]}]:?

category -> _ "#" __ [^:]:+ _ ":"
*/

/** @typedef {[string, T] | string} ParseResult<T> */
const matchVar = /[_a-z][_$a-z0-9]*/i;

export class Parser {
    /** @type {{ [key: string]: [string[], Function] }} */
    static tokens = {
        /** @typedef {[string, string]} IconMatch */
        icon: [['@'], function() {
            const variable = this.str.match(matchVar)?.[0];
            if (!variable) return 'No valid variable';
            this.str = this.str.slice(variable.length).trimStart();
        
            if (this.str[0] !== '=') return 'Not an icon definition';
            this.str = this.str.slice(1).trimStart();
        
            const urlEnd = this.str.indexOf(this.lineCap);
            if (urlEnd === -1) return 'Missing line delimeter';
            const url = this.str.slice(0, urlEnd);
            this.str = this.str.slice(urlEnd);
            if (this.str[0] === '/') return `${url}, ${urlEnd}`
            return [variable, url];
        }],
        /** @typedef {[string, string[]]} ListMatch */
        list: [['v', 'V', '^'], function() {
            const variable = this.str.match(matchVar)?.[0];
            if (!variable) return 'No valid variable';
            this.str = this.str.slice(variable.length).trimStart();
        
            if (this.str[0] !== '{') return 'Missing items table';
            const end = this.str.match(/(?<!\\)}/)?.index;
            if (typeof end !== 'number') return 'Missing end of items table symbol';
            const list = this.str.slice(1, end).trim();
            this.str = this.str.slice(end +1);
        
            const items = list.split(/(?<!\\),\s*/g)
                .map(item => item.replaceAll('\\,', ',').replaceAll('\\}', '}'))
                .filter(Boolean);
            return [variable, items];
        }],
        /** @typedef {[string, ParseResult<IconMatch|ListMatch|CategoryMatch|LabelMatch>[]]} CategoryMatch */
        category: [['#'], function() {
            const titleEnd = this.str.match(/(?<!\\):/)?.index;
            if (typeof titleEnd !== 'number') return 'Missing title end';
            const title = this.str.slice(0, titleEnd).replaceAll('\\:', ':');
            this.str = this.str.slice(titleEnd +1);
            const indent = this.str.slice(0, this.str.match(/[^\s]/)?.index) || ' ';
        
            const members = [];
            while (this.str.length) {
                if (!this.str.startsWith(indent)) break;
                this.lineCap = indent;
                const match = this.oneofParse(true);
                if (typeof (match ?? '') === 'string') return `${match} (category ${JSON.stringify(members)})`;
                members.push(match);
            }
            this.lineCap = '\n';
        
            return [title, members];
        }],
        /** @typedef {[boolean, string]} LabelMatch */
        label: [['//'], function() {
            const endIdx = this.str.indexOf(this.lineCap);
            if (endIdx === -1) return 'Missing line delimeter';
            let text = this.str.slice(0, endIdx).trim(), onClick = null;
            this.str = this.str.slice(endIdx);
            if (text[0] === '%') {
                text = text.slice(1).trimStart();
                const func = text.match(matchVar)?.[0];
                if (!func) return 'Missing function name when assigning for button';
                text = text.slice(func.length).trimStart();
                onClick = func;
            }
            return [onClick, text];
        }]
    }
    static blockInputs = {
        writeable: /^\(\s*[v^]\s*(?<list>[_a-z][_$a-z0-9]*)\s*(?<default>\$[_a-z][_$a-z0-9]*|(?:[^)]|\\\))*)\s*\)/i,
        degrees:   /^\(\s*@\s*(?<default>\$[_a-z][_$a-z0-9]*|[0-9E+-\.]*)\s*\)/i,
        number:    /^\(\s*(?<default>\$[_a-z][_$a-z0-9]*|[0-9E+-\.]*)\s*\)/i,
        list:      /^\[\s*[v^]\s*(?<list>[_a-z][_$a-z0-9]*)\s*(?<default>\$[_a-z][_$a-z0-9]*|(?:[^\]]|\\\])*)\s*\]/i,
        string:    /^\[\s*(?<default>\$[_a-z][_$a-z0-9]*|(?:[^\]]|\\\])*)\s*\]/i,
        boolean:   /^<\s*>/i,
        stack:     /^{\s*}/i,
        icon:      /^@\s*(?<icon>[_a-z][_$a-z0-9]*)/i
    }
    static blockPostProcess = {}

    lineCap = '\n';
    /** @param {string} str */
    constructor(str) { this.str = str; this.src = str; }

    /**
     * Parses the block definition out of a string
     * @param {string} str The string to parse
     * @returns {ParseResult<[...(string|{ type: string, [key: string]: string }), string[]]>}
     */
    parseBlockDef() {
        const parse = [""];
        let i = 0;
        for (; true; i++) {
            for (const name in Parser.blockInputs) {
                const match = Parser.blockInputs[name].exec(this.str.slice(i));
                if (match) {
                    match.groups ??= {};
                    match.groups.type = name;
                    parse.push(match.groups, "");
                    i += match[0].length;
                    break;
                }
            }
            if (/^(::|\n)/.test(this.str.slice(i))) break;
            parse[parse.length -1] += this.str[i];
        }
        this.str = this.str.slice(i);
        const endIdx = this.str.indexOf('\n') === -1 ? this.str.length : this.str.indexOf('\n');
        if (this.str.startsWith('::')) {
            const args = this.str.slice(2, endIdx);
            this.str = this.str.slice(endIdx);
            parse.push(args.split(/\s+/).filter(Boolean));
        } else parse.push([])
    
        return parse.map(str => str?.trim?.() ?? str).filter(Boolean);
    }
    /**
     * Gets a single valid parse for the current str position
     * @param {boolean} [allowBlock=true] Should we check for blocks as a valid match
     * @returns {ParseResult<any>} The resulting parsed value
     */
    oneofParse(allowBlock = true) {
        this.str = this.str.trimStart();
        const str = this.str;
        const matches = Object.keys(Parser.tokens)
            .map(name => {
                this.str = str;
                const symbol = Parser.tokens[name][0]
                    .find(initial => this.str.startsWith(initial));
                if (!symbol) return;
                this.str = this.str.slice(symbol.length).trimStart();
                const result = Parser.tokens[name][1].apply(this);
                return [name, result, str.length - this.str.length]
            })
            .filter(Boolean);
        this.str = str;
        if (!matches.length && !allowBlock) return `No matchers found for ${str.slice(0, 50).replaceAll(' ', '·').replaceAll('\n', '\\n')} (delim ${this.lineCap.replaceAll(' ', '·').replaceAll('\n', '\\n')})`
        if (matches.every(([, res]) => typeof (res ?? '') === 'string')) {
            const errors = matches.map(([name, res]) => `${name} "${res}"`);
            if (allowBlock) {
                this.str = str;
                const blockMatch = this.parseBlockDef();
                if (typeof (blockMatch ?? '') === 'string')
                    return `No valid parser matches found: ${errors}, block "${blockMatch}"`;
                return ['block', blockMatch];
            }
            return `No valid parser matches found: ${errors.join(', ')}`;
        }
        const match = matches.find(([, res]) => typeof (res ?? '') !== 'string');
        this.str = this.str.slice(match.pop());
        return match;
    }

    /**
     * Get any and all parsable members from the string
     * @returns {ParseResult<IconMatch|ListMatch|CategoryMatch|LabelMatch>[]}
     */
    parse() {
        const members = [];
        while (this.str.length) {
            const match = this.oneofParse(false);
            if (typeof (match ?? '') === 'string') return `${match} (@char ${this.length - this.src.length})`;
            members.push(match);
            if (/^\s*$/.test(this.str)) break;
        }
        return members;
    }
}

export const tokenHandles = {
    icon([variable, url], gen) { gen.vars[variable] = url; },
    list([variable, list], gen) { gen.vars[variable] = list; },
    category([name, contents], gen) { gen.push({ name, content: understandParse(contents) }); },
    label([onClick, label], gen) { gen.push({ label, onClick }); },
    block(block, gen) { gen.push(block); }
}
/**
 * Generates meaningful runtime data out of parse results
 * @param {ParseResult<IconMatch|ListMatch|CategoryMatch|LabelMatch>[]} parse 
 * @returns {{ [key: (string|number)]: any, vars: { [key: string]: string } }}
 */
export function understandParse(parse) {
    const gen = [];
    gen.vars = {};
    for (const [name, value] of parse) {
        const handle = tokenHandles[name] 
        if (typeof handle !== 'function') throw new TypeError(`Unregistered token name ${name}`);
        handle(value, gen);
    }
    return gen;
}