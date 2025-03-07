/**
 * @typedef {[boolean, string, number, number]} Comment
 * @typedef {string | number | boolean | Block | Block[]} Argument
 * @typedef {[string, any, Argument[], Comment]} Block
 * @typedef {[number, number, Block[]]} Script
 */

class VCWD {
    /**
     * Ensure that the module is accessible
     * @param {number} input 
     * @returns {number}
     */
    static sanityCheck(input) { return input + 1; }

    #toolbox
    toolbox = '';
    /** @type {Script[]} */
    scripts = [];
    /** @type {HTMLCanvasElement} */
    #canvas = null;
    get canvas() { return this.#canvas };
    set canvas(value) { this.#canvas = value };
    /** @type {CanvasRenderingContext2D} */
    ctx = null;
    /** @type {number} */
    get width() { return this.canvas.width }
    set width(value) { this.canvas.width = value }
    /** @type {number} */
    get height() { return this.canvas.height }
    set height(value) { this.canvas.height = value }

    /**
     * @param {HTMLCanvasElement} canvas The canvas that all rendered outputs will be on
     * @param {Script[]} [scripts=[]] Optional, the blocks to display inside this view
     */
    constructor(canvas, scripts) {
        if (scripts) this.scripts = scripts;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.redraw();
    }
    /** Redraw the canvas contents */
    redraw() { this.ctx.clearRect(0,0, this.width, this.height); }
}

if (typeof window !== 'undefined') {
    window.VCWD = VCWD;
}

export default VCWD;