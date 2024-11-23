# Notice
This project is under early development. It's not stable, or meant to be used in it's current state.
If you want to use it, don't expect me to help you fix any problems until I have finished developing it.

There is also no documentation available or guides to help you in this state. **You are on your own.**

# About
Visual Coding Web Display or VCWD is a rewrite of Blockly by Google using Canvas APIs under the MIT license.
The intent of this project is to reduce performance drops within block-based visual coding languages such as Scratch, while also allowing versatile APIs to do anything with the block interface, or even replace the blocks entirely with something like node-based visual coding.

The project is written like a Node.js module, however you can use it in a raw HTML file using the compiled version made with Browserify.
This is also the solution the playground files use, and is how the project should be tested during development.

# For your use
## Installation
WIP

## Usage
See the [user docs](docs/user/) for more info.

# How to contribute
## Installation
1. `npm ci`

## Development
1. `npm run dev`
2. Open one of the playground pages in [`src/playground`](src/playground/).

## Unit-Testing
1. `npm test`

## Building
1. `npm run build`

## Usage
See the [developer docs](docs/dev/) for more info.