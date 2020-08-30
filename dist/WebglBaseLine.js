/**
 * Baseline class
 */
export class WebglBaseLine {
    /**
     * @internal
     */
    constructor() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.loop = false;
        this._vbuffer = 0;
        this._prog = 0;
        this._coord = 0;
        this.visible = true;
        this.intensity = 1;
    }
    initProgram(webgl) {
        if (!WebglBaseLine.program) {
            this.createProgram(webgl);
        }
        this._prog = WebglBaseLine.program;
    }
    createProgram(webgl) {
        const vertShader = webgl.createShader(webgl.VERTEX_SHADER);
        webgl.shaderSource(vertShader, WebglBaseLine.vertCode);
        webgl.compileShader(vertShader);
        const fragShader = webgl.createShader(webgl.FRAGMENT_SHADER);
        webgl.shaderSource(fragShader, WebglBaseLine.fragCode);
        webgl.compileShader(fragShader);
        WebglBaseLine.program = webgl.createProgram();
        webgl.attachShader(WebglBaseLine.program, vertShader);
        webgl.attachShader(WebglBaseLine.program, fragShader);
        webgl.linkProgram(WebglBaseLine.program);
    }
}
WebglBaseLine.vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
          gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;
WebglBaseLine.fragCode = `
      precision mediump float;
      uniform highp vec4 uColor;

      void main(void) {
         gl_FragColor =  uColor;
      }`;
//# sourceMappingURL=WebglBaseLine.js.map