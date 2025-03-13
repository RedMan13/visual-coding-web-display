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
    static parsers = {
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
        /** @typedef {[string, (ParseResult<[string, string]>|ParseResult<[string, string[]]>)[]]} CategoryMatch */
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

    lineCap = '\n';
    /** @param {string} str */
    constructor(str) { this.str = str; }

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
        const endIdx = this.str.indexOf(this.lineCap) === -1 ? this.str.length : this.str.indexOf(this.lineCap);
        if (this.str.startsWith('::')) {
            const args = this.str.slice(2, endIdx);
            this.str = this.str.slice(endIdx);
            parse.push(args.split(/\s+/).filter(Boolean));
        }
    
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
        const matches = Object.keys(Parser.parsers)
            .map(name => {
                this.str = str;
                const symbol = Parser.parsers[name][0]
                    .find(initial => this.str.startsWith(initial));
                if (!symbol) return;
                this.str = this.str.slice(symbol.length).trimStart();
                const result = Parser.parsers[name][1].apply(this);
                return [name, result, str.length - this.str.length]
            })
            .filter(Boolean);
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

    parse() {
        const members = [];
        while (this.str.length) {
            const match = this.oneofParse(false);
            if (typeof (match ?? '') === 'string') return `${match} (HEAD parse ${JSON.stringify(members)})`;
            members.push(match);
            if (/^\s*$/.test(this.str)) break;
        }
        return members;
    }
}