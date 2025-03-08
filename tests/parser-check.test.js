import { parse, parseBlockDef, parseIconDef, parseCategoryDef, parseListDef } from "../src/toolbox";
const sample = `
# Movement:
    v pointingItems {
        mouse-pointer,
        random direction,
    }
    move (1) steps
    point towards [v pointingItems]
    if on edge, bounce
# Events:
    @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
    when @greenFlag pressed :: hat
# Control:
    @loopArm = https://studio.penguinmod.com/static/blocks-media/repeat.svg
    forever {} @loopArm
`.replaceAll('\n', '');

test('List Definition', () => {
    expect(parseListDef(`
        V skibidi { 
            gyatt 
        }
    `)).toStrictEqual([50, ['skibidi', ['gyatt']]]);

    expect(parseListDef(`
        V skibidi { 
            gyatt,
            ohio
        }
    `)).toStrictEqual([67, ['skibidi', ['gyatt', 'ohio']]]);

    expect(parseListDef(`
        V skibidi { 
            gyatt,
            ohio, rizz
        }
    `)).toStrictEqual([73, ['skibidi', ['gyatt', 'ohio', 'rizz']]]);
    
    expect(parseListDef(`
        V skibidi { 
            gyatt,
        }
    `)).toStrictEqual([50, ['skibidi', ['gyatt']]]);

    expect(parseListDef(`
        V skibidi { 
            gyatt,
            ohio\\, rizz
        }
    `)).toStrictEqual([74, ['skibidi', ['gyatt', 'ohio, rizz']]]);

    expect(parseListDef('@icon = /static/loop.svg\n'))
        .toStrictEqual('Not a list');
    expect(parseListDef(`
        # Events:
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
    `)).toStrictEqual('Not a list');
});

test('Icon Definition', () => {
    expect(parseIconDef('@icon = /static/loop.svg\n', '\n'))
        .toStrictEqual([24, ['icon', '/static/loop.svg']]);
    expect(parseIconDef('@icon = /static/loop.svg ', ' '))
        .toStrictEqual([24, ['icon', '/static/loop.svg']]);

    expect(parseIconDef(`V skibidi { gyatt } `, ' '))
        .toStrictEqual('Not an icon');
    expect(parseIconDef(`
        # Events:
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
    `)).toStrictEqual('Not an icon');
});

test('Category Definition', () => {
    expect(parseCategoryDef(`
        # Events:
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
    `)).toStrictEqual([240, ['Events', [
        ['skibidi', ['gyatt', 'ohio, rizz']],
        ['greenFlag', 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg'], 
        "when @greenFlag pressed :: hat"
    ]]]);

    expect(parseCategoryDef(`
        # Events:
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
        # Movement:
            v pointingItems {
                mouse-pointer,
                random direction,
            }
            move (1) steps
            point towards [v pointingItems]
            if on edge, bounce
    `)).toStrictEqual([240, ['Events', [
        ['skibidi', ['gyatt', 'ohio, rizz']],
        ['greenFlag', 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg'], 
        "when @greenFlag pressed :: hat"
    ]]]);

    expect(parseCategoryDef('@icon = /static/loop.svg\n'))
        .toStrictEqual('Not a category');
    expect(parseCategoryDef(`V skibidi { gyatt } `, ' '))
        .toStrictEqual('Not a category');
})

test('raw output', () => {
    //expect(parse(sample)).toBe(null);
});