import code from "../src/block-def.ne" with { type: "txt" };
import compile from 'nearley/lib/compile';
import generate from 'nearley/lib/generate';
import nearleyGrammar from 'nearley/lib/nearley-language-bootstrapped';
import nearley from 'nearley';
function compileGrammar(sourceCode) {
    // Parse the grammar source into an AST
    const grammarParser = new nearley.Parser(nearleyGrammar);
    grammarParser.feed(sourceCode);
    const grammarAst = grammarParser.results[0]; // TODO check for errors

    // Compile the AST into a set of rules
    const grammarInfoObject = compile(grammarAst, {});
    // Generate JavaScript code from the rules
    const grammarJs = generate(grammarInfoObject, "grammar");

    // Pretend this is a CommonJS environment to catch exports from the grammar.
    const module = { exports: {} };
    eval(grammarJs);

    return module.exports;
}
const grammar = compileGrammar(code);
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
const sample = `
# Movement:
    v pointingItems {
        mouse-pointer
        random direction
    }
    move (1) steps
    point towards [v pointingItems]
    if on edge, bounce
# Events:
    @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
    when @greenFlag pressed
# Control:
    @loopArm = https://studio.penguinmod.com/static/blocks-media/repeat.svg
    forever {} @loopArm
`;

console.log(parser.feed(sample));