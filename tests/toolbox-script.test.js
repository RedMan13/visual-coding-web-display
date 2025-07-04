import { Parser, understandParse } from "../src/toolbox";

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
    ['// basic funny things\n', ['label', [null, 'basic funny things']]],
    ['// %idosometh basic funny things\n', ['label', ['idosometh', 'basic funny things']]],

    [`
        # Events:
            // basic funny things
            V skibidi { 
                gyatt,
                ohio\\, rizz
            }
            @greenFlag = https://studio.penguinmod.com/static/blocks-media/blue-flag.svg
            when @greenFlag pressed :: hat
    `, ['category', ['Events', [
        ['label', [null, 'basic funny things']],
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
            // basic funny things
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
        ['label', [null, 'basic funny things']],
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

test('Runtime Generator', () => {
    expect(understandParse([
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
    ])).toEqual(Object.assign([], {
        vars: {},
        0: { name: 'Movement', content: Object.assign([], {
            vars: {
                pointingItems: [
                    'mouse-pointer',
                    'random direction'
                ]
            },
            0: ['move', { type: 'number', default: '1' }, 'steps', []],
            1: ['point towards', { type: 'list', list: 'pointingItems', default: '' }, []],
            2: ['if on edge, bounce', []]
        }) },
        1: { name: 'Events', content: Object.assign([], {
            vars: {
                greenFlag: 'https://studio.penguinmod.com/static/blocks-media/blue-flag.svg',
            },
            0: ['when', { type: 'icon', icon: 'greenFlag' }, 'pressed', ['hat']]
        }) },
        2: { name: 'Control', content: Object.assign([], {
            vars: {
                loopArm: 'https://studio.penguinmod.com/static/blocks-media/repeat.svg'
            },
            0: ['forever', { type: 'stack' }, { type: 'icon', icon: 'loopArm' }, []]
        }) }
    }))
})