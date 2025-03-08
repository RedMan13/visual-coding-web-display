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

const matchVar = /[_a-z][_$a-z0-9]*/i;
/** @typedef {[number, T] | string} ParseResult<T> */

/**
 * Parses an icon definition line out of a string
 * @param {string} str The string to parse
 * @param {string} lineCap The deliminating string of characters
 * @returns {ParseResult<[string, string]>} Key value pair of the icon variable name and its url
 */
export function parseIconDef(str, lineCap) {
    const len = str.length;
    str = str.trimStart();

    if (str[0] !== '@') return 'Not an icon';
    str = str.slice(1).trimStart();

    const variable = str.match(matchVar)?.[0];
    if (!variable) return 'No valid variable';
    str = str.slice(variable.length).trimStart();

    if (str[0] !== '=') return 'Not an icon definition';
    str = str.slice(1).trimStart();

    const urlEnd = str.indexOf(lineCap);
    if (urlEnd === -1) return 'Missing line delimeter';
    const url = str.slice(0, urlEnd);
    str = str.slice(urlEnd);
    return [len - str.length, [variable, url]];
}

/**
 * Parse out the list definition box
 * @param {string} str The string to parse
 * @returns {ParseResult<[string, string[]]>} Key value pair of the list variable and its items
 */
export function parseListDef(str) {
    const len = str.length;
    str = str.trimStart();

    if (!['v', 'V', '^'].includes(str[0])) return 'Not a list';
    str = str.slice(1).trimStart();

    const variable = str.match(matchVar)?.[0];
    if (!variable) return 'No valid variable';
    str = str.slice(variable.length).trimStart();

    if (str[0] !== '{') return 'Missing items table';
    const end = str.match(/(?<!\\)}/)?.index;
    if (typeof end !== 'number') return 'Missing end of items table symbol';
    const list = str.slice(1, end).trim();
    str = str.slice(end +1);

    const items = list.split(/(?<!\\),\s*/g)
        .map(item => item.replaceAll('\\,', ',').replaceAll('\\}', '}'))
        .filter(Boolean);
    return [len - str.length, [variable, items]];
}

export function parseBlockDef(str) {
    const len = str.length;
    str = str.trimStart();

    const lineEnd = str.indexOf('\n');
    if (lineEnd === -1) return 'No end of line';
    const line = str.slice(0, lineEnd).trim();
    str = str.slice(lineEnd);

    return [len - str.length, line];
}

/**
 * Parses out a whole category definition from inside a string
 * @param {string} str The string to parse
 * @returns {ParseResult<[string, (ParseResult<[string, string]>|ParseResult<[string, string[]]>)[]]>}
 */
export function parseCategoryDef(str) {
    const len = str.length;
    str = str.trimStart();

    if (str[0] !== '#') return 'Not a category';
    str = str.slice(1).trimStart();

    const titleEnd = str.match(/(?<!\\):/)?.index;
    if (typeof titleEnd !== 'number') return 'Missing title end';
    const title = str.slice(0, titleEnd).replaceAll('\\:', ':');
    str = str.slice(titleEnd +1);
    const indent = str.slice(0, str.match(/[^\s]/)?.index) || ' ';

    const members = [];
    while (str.length) {
        if (!str.startsWith(indent)) break;
        const matchIcon = parseIconDef(str + indent, indent);
        const matchList = parseListDef(str);
        const matchBlock = parseBlockDef(str);
        const match = typeof matchIcon !== 'string' 
            ? matchIcon
            : typeof matchList !== 'string' 
                ? matchList
                : matchBlock;
        if (typeof (match ?? '') === 'string')
            return `Couldnt find a valid match: Icon Definition "${matchIcon}", List Definition "${matchList}", Block Definition "${matchBlock}"`;
        members.push(match[1]);
        str = str.slice(match[0]);
    }

    return [len - str.length, [title, members]];
}

/**
 * Parses a toolbox definition script
 * @param {string} str The script to parse
 */
export function parse(str) {

}