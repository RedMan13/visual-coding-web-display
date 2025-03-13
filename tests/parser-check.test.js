import { Parser } from "../src/toolbox";

const subSamples = [
    [`V skibidi { gyatt }`, ['list', ['skibidi', ['gyatt']]]],
    [`
        V skibidi { 
            rizz 
        }
    `, ['list', ['skibidi', ['rizz']]]],
    [`
        V skibidi { 
            gyatt,
            ohio
        }
    `, ['list', ['skibidi', ['gyatt', 'ohio']]]],
    [`
        V skibidi { 
            gyatt,
            ohio, rizz
        }
    `, ['list', ['skibidi', ['gyatt', 'ohio', 'rizz']]]],
    [`
        V skibidi { 
            ohio,
        }
    `, ['list', ['skibidi', ['ohio']]]],
    [`
        V skibidi { 
            gyatt,
            ohio\\, rizz
        }
    `, ['list', ['skibidi', ['gyatt', 'ohio, rizz']]]],

    ['@icon = /static/loop.svg\n', ['icon', ['icon', '/static/loop.svg']]],

    [`
        # Events:
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
    `, ['category', ['Events', [
        ['list', ['skibidi', ['gyatt', 'ohio, rizz']]],
        ['icon', ['greenFlag', 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg']], 
        ['block', ['when', { type: 'icon', icon: 'greenFlag' }, 'pressed', ['hat']]]
    ]]]],
    [`
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
    `, ['category', ['Events', [
        ['list', ['skibidi', ['gyatt', 'ohio, rizz']]],
        ['icon', ['greenFlag', 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg']], 
        ['block', ['when', { type: 'icon', icon: 'greenFlag' }, 'pressed', ['hat']]]
    ]]]]
];

test('Parser checks', () => {
    for (const [sample, expected] of subSamples) {
        const parser = new Parser(sample);
        expect(parser.oneofParse(false)).toEqual(expected);
    }
})

test('Raw output', () => {
    const parser = new Parser(`
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
    `);
    expect(parser.parse()).toEqual([
        ['category', ['Movement', [
            ['list', ['pointingItems', [
                'mouse-pointer',
                'random direction'
            ]]],
            ['block', ['move', { type: 'number', default: '1' }, 'steps', []]],
            ['block', ['point towards', { type: 'list', list: 'pointingItems', default: '' }, []]],
            ['block', ['if on edge, bounce', []]]
        ]]],
        ['category', ['Events', [
            ['icon', ['greenFlag', 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg']],
            ['block', ['when', { type: 'icon', icon: 'greenFlag' }, 'pressed', ['hat']]]
        ]]],
        ['category', ['Control', [
            ['icon', ['loopArm', 'https://studio.penguinmod.com/static/blocks-media/repeat.svg']],
            ['block', ['forever', { type: 'stack' }, { type: 'icon', icon: 'loopArm' }, []]]
        ]]],
    ]);
});