var x = Object.defineProperty;
var F = (c, e, r) => e in c ? x(c, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : c[e] = r;
var i = (c, e, r) => F(c, typeof e != "symbol" ? e + "" : e, r);
class B {
  constructor(e, r, t, o) {
    i(this, "r");
    i(this, "g");
    i(this, "b");
    i(this, "a");
    this.r = e, this.g = r, this.b = t, this.a = o;
  }
  toArray() {
    return [this.r, this.g, this.b, this.a];
  }
}
class w {
  constructor(e) {
    i(this, "wglp");
    i(this, "lines");
    i(this, "gl");
    i(this, "coord");
    i(this, "vbuffer");
    i(this, "prog");
    this.wglp = e, this.gl = e.gl;
    const r = this.gl;
    this.lines = [];
    const t = `#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`, o = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!o)
      throw new Error("Error creating vertex shader");
    this.gl.shaderSource(o, t), this.gl.compileShader(o), r.getShaderParameter(o, r.COMPILE_STATUS) || console.error(r.getShaderInfoLog(o));
    const h = `#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`, a = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!a)
      throw new Error("Error creating fragment shader");
    this.gl.shaderSource(a, h), this.gl.compileShader(a), r.getShaderParameter(a, r.COMPILE_STATUS) || console.error(r.getShaderInfoLog(a)), this.prog = this.gl.createProgram(), this.gl.attachShader(this.prog, o), this.gl.attachShader(this.prog, a), this.gl.linkProgram(this.prog), this.gl.useProgram(this.prog), this.vbuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer), this.coord = this.gl.getAttribLocation(this.prog, "coord"), this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.coord), r.useProgram(this.prog);
    const l = r.getUniformLocation(this.prog, "uscale");
    r.uniformMatrix2fv(
      l,
      !1,
      new Float32Array([this.wglp.gScaleX, 0, 0, this.wglp.gScaleY])
    );
    const s = r.getUniformLocation(this.prog, "uoffset");
    r.uniform2fv(
      s,
      new Float32Array([this.wglp.gOffsetX, this.wglp.gOffsetY])
    );
    const g = r.getUniformLocation(this.prog, "uColor");
    r.uniform4fv(g, [1, 1, 0, 1]);
  }
  addLine(e) {
    this.lines.push(e);
  }
  draw() {
    this.gl.useProgram(this.prog), this.lines.forEach((e) => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer), this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(e.xy),
        this.gl.STREAM_DRAW
      );
      const r = this.gl.getUniformLocation(this.prog, "uColor");
      this.gl.uniform4f(
        r,
        e.color.r,
        e.color.g,
        e.color.b,
        e.color.a
      ), this.gl.drawArrays(this.gl.LINE_STRIP, 0, e.xy.length / 2);
    });
  }
}
class C {
  constructor(e, r) {
    i(this, "wglp");
    i(this, "headIndex", 0);
    i(this, "color");
    i(this, "squareSize");
    i(this, "maxSquare");
    i(this, "gl");
    i(this, "squareIndices", new Uint16Array([0, 1, 2, 2, 1, 3]));
    i(this, "colorsBuffer");
    i(this, "positionBuffer");
    i(this, "prog");
    i(this, "attrPosLocation");
    i(this, "attrColorLocation");
    this.wglp = e, this.color = new B(1, 1, 1, 1), this.squareSize = 0.1, this.maxSquare = r, this.gl = e.gl;
    const t = this.gl, o = t.createShader(t.VERTEX_SHADER);
    if (!o)
      throw new Error("Unable to create vertex shader");
    t.shaderSource(
      o,
      `#version 300 es

    layout(location = 1) in vec2 position;
    layout(location = 2) in vec3 sColor;
    uniform float u_size;
    uniform vec2 u_offset;
    uniform mat2 u_scale;

    out vec3 vColor;
    
    void main() {
      vColor = sColor / vec3(255.0, 255.0, 255.0);
      vec2 squareVertices[4] = vec2[4](vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0));
      vec2 pos = u_size * squareVertices[gl_VertexID] + position;
      gl_Position = vec4((u_scale * pos) + u_offset, 0.0, 1.0);
    }

`
    ), t.compileShader(o), t.getShaderParameter(o, t.COMPILE_STATUS) || console.error(t.getShaderInfoLog(o));
    const h = t.createShader(t.FRAGMENT_SHADER);
    if (!h)
      throw new Error("Unable to create fragment shader");
    t.shaderSource(
      h,
      `#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`
    ), t.compileShader(h), t.getShaderParameter(h, t.COMPILE_STATUS) || console.error(t.getShaderInfoLog(h));
    const a = t.createProgram();
    t.attachShader(a, o), t.attachShader(a, h), t.linkProgram(a), t.useProgram(a), this.prog = a;
    const l = t.createBuffer();
    t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, l), t.bufferData(t.ELEMENT_ARRAY_BUFFER, this.squareIndices, t.STATIC_DRAW);
    const s = new Float32Array(
      Array.from({ length: this.maxSquare * 2 }, () => 0)
    );
    this.positionBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferData(t.ARRAY_BUFFER, s, t.DYNAMIC_DRAW), this.attrPosLocation = t.getAttribLocation(this.prog, "position"), t.vertexAttribPointer(this.attrPosLocation, 2, t.FLOAT, !1, 0, 0), t.vertexAttribDivisor(this.attrPosLocation, 1), t.enableVertexAttribArray(this.attrPosLocation);
    const g = new Uint8Array(
      Array.from({ length: this.maxSquare * 3 }, () => 255)
    );
    this.colorsBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.colorsBuffer), t.bufferData(t.ARRAY_BUFFER, g, t.DYNAMIC_DRAW), this.attrColorLocation = t.getAttribLocation(this.prog, "sColor"), t.vertexAttribPointer(
      this.attrColorLocation,
      3,
      t.UNSIGNED_BYTE,
      !1,
      0,
      0
    ), t.vertexAttribDivisor(this.attrColorLocation, 1), t.enableVertexAttribArray(this.attrColorLocation), this.setScale(1, 1), this.setOffset(0, 0);
  }
  setColor(e) {
    this.color = e;
    const r = this.gl.getUniformLocation(
      this.prog,
      "u_color"
    );
    this.gl.uniform4f(r, e.r, e.g, e.b, e.a);
  }
  setSquareSize(e) {
    this.squareSize = e;
    const r = this.gl.getUniformLocation(this.prog, "u_size");
    this.gl.uniform1f(r, this.squareSize);
  }
  setScale(e, r) {
    const t = this.gl.getUniformLocation(
      this.prog,
      "u_scale"
    );
    this.gl.uniformMatrix2fv(t, !1, [
      e * this.wglp.gScaleX,
      0,
      0,
      r * this.wglp.gScaleY
    ]);
  }
  setOffset(e, r) {
    const t = this.gl.getUniformLocation(
      this.prog,
      "u_offset"
    );
    this.gl.uniform2f(
      t,
      e + this.wglp.gOffsetX,
      r + this.wglp.gOffsetY
    );
  }
  addSquare(e, r) {
    const t = this.gl;
    t.useProgram(this.prog), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferSubData(
      this.gl.ARRAY_BUFFER,
      this.headIndex * 2 * 4,
      e,
      0,
      e.length
    ), t.enableVertexAttribArray(this.attrPosLocation), t.bindBuffer(t.ARRAY_BUFFER, this.colorsBuffer), t.bufferSubData(
      this.gl.ARRAY_BUFFER,
      this.headIndex * 3 * 1,
      r,
      0,
      r.length
    ), t.enableVertexAttribArray(this.attrColorLocation), this.headIndex = (this.headIndex + e.length / 2) % this.maxSquare;
  }
  draw() {
    this.gl.useProgram(this.prog), this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      this.squareIndices.length,
      this.gl.UNSIGNED_SHORT,
      0,
      this.maxSquare
    );
  }
}
class y {
  constructor(e, r) {
    i(this, "xy", []);
    i(this, "color");
    e === void 0 && (e = [0, 0, 1, 1]), r === void 0 && (r = new B(1, 1, 1, 1)), this.xy = e, this.color = r;
  }
  getSize() {
    return this.xy.length / 2;
  }
  setY(e) {
    for (let r = 0; r < this.xy.length; r += 2)
      this.xy[r + 1] = e;
  }
  setYs(e) {
    if (e.length == this.xy.length / 2)
      for (let r = 0; r < this.xy.length; r += 2)
        this.xy[r + 1] = e[r / 2];
    else
      throw new Error("mismatch in array length");
  }
  setXYArray(e) {
    this.xy = e;
  }
  setX(e) {
    for (let r = 0; r < this.xy.length; r += 2)
      this.xy[r] = e;
  }
  lineSpaceX(e) {
    const r = e;
    this.xy = new Array(r * 2);
    for (let t = 0; t < r; t++)
      this.xy[t * 2] = 2 * t / r - 1, this.xy[t * 2 + 1] = 0;
  }
  emptyLine(e) {
    const r = e;
    this.xy = new Array(r * 2);
    for (let t = 0; t < r; t++)
      this.xy[t * 2] = 0, this.xy[t * 2 + 1] = 0;
  }
  setColor(e) {
    this.color = e;
  }
}
class U {
  constructor(e, r, t) {
    i(this, "gl");
    i(this, "aPositionLocation");
    i(this, "vertexBuffer");
    i(this, "program");
    i(this, "rollBufferSize");
    i(this, "shift");
    i(this, "dataIndex");
    i(this, "dataX");
    i(this, "lastDataX");
    i(this, "lastDataY");
    i(this, "numLines");
    i(this, "ext");
    i(this, "colorBuffer");
    i(this, "aColorLocation");
    i(this, "uShiftLocation");
    this.gl = e.gl, this.rollBufferSize = r, this.shift = 0, this.dataIndex = 0, this.dataX = 1, this.lastDataX = Array(t).fill(0), this.lastDataY = Array(t).fill(0), this.numLines = t;
    const o = this.gl;
    this.ext = o.getExtension("WEBGL_multi_draw");
    const h = `#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color/ vec3(255.0, 255.0, 255.0);
        }`, a = o.createShader(o.VERTEX_SHADER);
    if (!a)
      throw new Error("Failed to create vertex shader");
    o.shaderSource(a, h), o.compileShader(a), o.getShaderParameter(a, o.COMPILE_STATUS) || console.error(o.getShaderInfoLog(a));
    const l = `#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`, s = o.createShader(o.FRAGMENT_SHADER);
    if (!s)
      throw new Error("Failed to create fragment shader");
    o.shaderSource(s, l), o.compileShader(s), o.getShaderParameter(s, o.COMPILE_STATUS) || console.error(o.getShaderInfoLog(s)), this.program = o.createProgram(), o.attachShader(this.program, a), o.attachShader(this.program, s), o.linkProgram(this.program), o.getProgramParameter(this.program, o.LINK_STATUS) || console.error(o.getProgramInfoLog(this.program)), this.vertexBuffer = o.createBuffer(), o.bindBuffer(o.ARRAY_BUFFER, this.vertexBuffer), o.bufferData(
      o.ARRAY_BUFFER,
      new Float32Array((this.rollBufferSize + 2) * 2 * t),
      o.DYNAMIC_DRAW
    ), this.aPositionLocation = o.getAttribLocation(this.program, "a_position"), o.vertexAttribPointer(this.aPositionLocation, 2, o.FLOAT, !1, 0, 0), o.enableVertexAttribArray(this.aPositionLocation), this.colorBuffer = o.createBuffer();
    const g = Array((this.rollBufferSize + 2) * 3 * t).fill(128);
    o.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer), this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Uint8Array(g),
      o.STATIC_DRAW
    ), this.aColorLocation = o.getAttribLocation(this.program, "a_color"), o.vertexAttribPointer(
      this.aColorLocation,
      3,
      o.UNSIGNED_BYTE,
      !1,
      0,
      0
    ), o.enableVertexAttribArray(this.aColorLocation), this.uShiftLocation = o.getUniformLocation(this.program, "uShift");
  }
  addPoint(e) {
    const r = this.gl, t = this.rollBufferSize + 2;
    this.shift += 2 / this.rollBufferSize, this.dataX += 2 / this.rollBufferSize, r.useProgram(this.program), r.uniform1f(this.uShiftLocation, this.shift), r.bindBuffer(r.ARRAY_BUFFER, this.vertexBuffer);
    for (let o = 0; o < this.numLines; o++)
      r.bufferSubData(
        r.ARRAY_BUFFER,
        (this.dataIndex + t * o) * 2 * 4,
        new Float32Array([this.dataX, e[o]])
      );
    if (r.enableVertexAttribArray(this.aPositionLocation), this.dataIndex === this.rollBufferSize - 1)
      for (let o = 0; o < this.numLines; o++)
        this.lastDataX[o] = this.dataX, this.lastDataY[o] = e[o];
    if (this.dataIndex === 0 && this.lastDataX[0] !== 0)
      for (let o = 0; o < this.numLines; o++)
        r.bufferSubData(
          r.ARRAY_BUFFER,
          (this.rollBufferSize + t * o) * 2 * 4,
          new Float32Array([
            this.lastDataX[o],
            this.lastDataY[o],
            this.dataX,
            e[o]
          ])
        );
    this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize;
  }
  addPoints(e) {
    const r = this.gl, t = this.rollBufferSize + 2;
    r.useProgram(this.program), r.uniform1f(this.uShiftLocation, this.shift), r.bindBuffer(r.ARRAY_BUFFER, this.vertexBuffer);
    let o = this.dataIndex, h = 0;
    for (let a = 0; a < e.length; a++) {
      o = this.dataIndex, h = 0;
      for (let l = 0; l < e[a].length; l++) {
        const s = this.dataX + l * 2 / this.rollBufferSize;
        if (o < this.rollBufferSize && r.bufferSubData(
          r.ARRAY_BUFFER,
          (o + a * t) * 2 * 4,
          new Float32Array([s, e[a][l]])
        ), o === this.rollBufferSize - 1 && (this.lastDataX[a] = s, this.lastDataY[a] = e[a][l]), o % this.rollBufferSize === 0 && this.lastDataX[a] !== 0 && r.bufferSubData(
          r.ARRAY_BUFFER,
          (this.rollBufferSize + a * t) * 2 * 4,
          new Float32Array([
            this.lastDataX[a],
            this.lastDataY[a],
            s,
            e[a][l]
          ])
        ), o >= this.rollBufferSize) {
          const g = o % this.rollBufferSize;
          r.bufferSubData(
            r.ARRAY_BUFFER,
            (g + a * t) * 2 * 4,
            new Float32Array([s, e[a][l]])
          );
        }
        o++, h = s;
      }
    }
    this.shift += e[0].length * 2 / this.rollBufferSize, this.dataX = h + 2 / this.rollBufferSize, this.dataIndex = o % this.rollBufferSize, r.enableVertexAttribArray(this.aPositionLocation);
  }
  drawOld() {
    const e = this.rollBufferSize + 2, r = this.gl;
    this.gl.useProgram(this.program);
    for (let t = 0; t < this.numLines; t++)
      r.drawArrays(r.LINE_STRIP, t * e, this.dataIndex), r.drawArrays(
        r.LINE_STRIP,
        t * e + this.dataIndex,
        this.rollBufferSize - this.dataIndex
      ), r.drawArrays(r.LINE_STRIP, t * e + this.rollBufferSize, 2);
  }
  drawExt() {
    const e = this.rollBufferSize + 2, r = this.gl;
    this.gl.useProgram(this.program);
    const t = [], o = [];
    for (let h = 0; h < this.numLines; h++)
      t.push(h * e), o.push(this.dataIndex), t.push(h * e + this.dataIndex), o.push(this.rollBufferSize - this.dataIndex), t.push(h * e + this.rollBufferSize), o.push(2);
    if (!this.ext)
      throw new Error("Multi draw extension not available");
    this.ext.multiDrawArraysWEBGL(
      r.LINE_STRIP,
      t,
      0,
      o,
      0,
      o.length
    );
  }
  draw() {
    this.ext ? this.drawExt() : this.drawOld();
  }
  setLineColor(e, r) {
    const t = this.gl;
    t.useProgram(this.program), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer);
    const o = [];
    for (let h = 0; h < this.rollBufferSize + 2; h++)
      o.push(e.r), o.push(e.g), o.push(e.b);
    t.bufferSubData(
      t.ARRAY_BUFFER,
      (this.rollBufferSize + 2) * 3 * r * 1,
      new Uint8Array(o)
    ), t.enableVertexAttribArray(this.aColorLocation);
  }
}
class I {
  constructor(e, r) {
    i(this, "lines");
    i(this, "gl");
    i(this, "coord");
    i(this, "vertexBuffer");
    i(this, "prog");
    i(this, "lineSizes");
    i(this, "totalLineSizes");
    i(this, "lineSizeAccum");
    i(this, "updateLine", (e) => {
      const r = this.gl;
      r.useProgram(this.prog), r.bindBuffer(r.ARRAY_BUFFER, this.vertexBuffer), r.bufferSubData(
        r.ARRAY_BUFFER,
        4 * 2 * this.lineSizeAccum[e],
        new Float32Array(this.lines[e].xy)
      ), r.enableVertexAttribArray(this.coord);
    });
    i(this, "draw", () => {
      const e = this.gl;
      e.useProgram(this.prog);
      for (let r = 0; r < this.lineSizes.length; r++)
        e.drawArrays(e.LINE_STRIP, this.lineSizeAccum[r], this.lineSizes[r]);
    });
    this.gl = e.gl;
    const t = this.gl;
    this.lines = r;
    const o = r.map((f) => f.xy.length / 2);
    this.lineSizes = o;
    const h = `#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_Color;
      
        out vec3 vColor;
      
        void main() {
            vColor = a_Color;
            gl_Position = vec4(a_position, 0, 1);
        }`, a = t.createShader(t.VERTEX_SHADER);
    if (!a)
      throw new Error("Error creating vertex shader");
    t.shaderSource(a, h), t.compileShader(a), t.getShaderParameter(a, t.COMPILE_STATUS) || console.error(t.getShaderInfoLog(a));
    const l = `#version 300 es
        precision mediump float;
        in vec3 vColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(vColor,0.8);
        }`, s = t.createShader(t.FRAGMENT_SHADER);
    if (!s)
      throw new Error("Error creating fragment shader");
    t.shaderSource(s, l), t.compileShader(s), t.getShaderParameter(s, t.COMPILE_STATUS) || console.error(t.getShaderInfoLog(s)), this.prog = t.createProgram(), t.attachShader(this.prog, a), t.attachShader(this.prog, s), t.linkProgram(this.prog), t.useProgram(this.prog);
    const g = t.createBuffer();
    t.bindBuffer(t.ARRAY_BUFFER, g), this.totalLineSizes = o.reduce((f, u) => f + u, 0), this.lineSizeAccum = o.reduce(
      (f, u) => (f.push(f[f.length - 1] + u), f),
      [0]
    ).splice(0, o.length);
    const S = Array.from({ length: o.length }, () => [
      Math.random(),
      Math.random(),
      Math.random()
    ]);
    let m = Array.from({ length: o[0] }, (f, u) => u).flatMap(
      () => S[0]
    );
    for (let f = 1; f < o.length; f++)
      m = m.concat(
        Array.from({ length: o[f] }, (u, R) => R).flatMap(
          () => S[f]
        )
      );
    t.bufferData(
      t.ARRAY_BUFFER,
      new Float32Array(m),
      t.DYNAMIC_DRAW
    );
    const v = t.getAttribLocation(this.prog, "a_Color");
    t.vertexAttribPointer(v, 3, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(v), this.vertexBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), this.coord = t.getAttribLocation(this.prog, "a_position"), t.vertexAttribPointer(this.coord, 2, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(this.coord);
    const p = new Float32Array(this.totalLineSizes * 2);
    t.bufferData(
      t.ARRAY_BUFFER,
      new Float32Array(p),
      t.DYNAMIC_DRAW
    ), t.clearColor(0.1, 0.1, 0.1, 1), t.clear(t.COLOR_BUFFER_BIT), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA), t.viewport(0, 0, e.width, e.height);
  }
}
class D {
  constructor(e, r) {
    i(this, "line");
    i(this, "gl");
    i(this, "prog");
    i(this, "width");
    i(this, "height");
    i(this, "vao");
    this.gl = e.gl;
    const t = this.gl;
    this.line = r, this.width = e.width, this.height = e.height;
    function o(n, b, _) {
      const d = n.createShader(b);
      if (!d) throw new Error("Could not create shader");
      if (n.shaderSource(d, _), n.compileShader(d), !n.getShaderParameter(d, n.COMPILE_STATUS))
        throw new Error("Shader compile error: " + n.getShaderInfoLog(d));
      return d;
    }
    function h(n, b, _) {
      const d = o(n, n.VERTEX_SHADER, b), L = o(n, n.FRAGMENT_SHADER, _), A = n.createProgram();
      if (!A) throw new Error("Could not create program");
      if (n.attachShader(A, d), n.attachShader(A, L), n.linkProgram(A), !n.getProgramParameter(A, n.LINK_STATUS))
        throw new Error("Program link error: " + n.getProgramInfoLog(A));
      return A;
    }
    const s = h(t, `#version 300 es
precision mediump float;
layout(location=0) in vec2 aPosition;
out vec2 vUV;
void main() {
  // Convert NDC to [0,1] UV (optional, not strictly used in our distance calc).
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`, `#version 300 es
precision mediump float;
in vec2 vUV;
out vec4 fragColor;
  
// Maximum of 100 points in the polyline.
uniform vec2 uPoints[100];
uniform int uNumPoints;
uniform float uThickness;    // Desired constant line thickness (in pixels).
uniform float uCanvasHeight; // Needed to flip gl_FragCoord's y coordinate.

// Compute the distance from point p to segment ab.
float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  // gl_FragCoord has its origin at the bottom-left.
  // Flip y to convert it to canvas space with (0,0) at the top-left.
  vec2 pos = vec2(gl_FragCoord.x, uCanvasHeight - gl_FragCoord.y);
  
  // Find the minimal distance from the current pixel to any segment.
  float d = 1e10;
  for (int i = 0; i < 100; i++) {
    if (i >= uNumPoints - 1) break;
    float dist = segmentDistance(pos, uPoints[i], uPoints[i+1]);
    d = min(d, dist);
  }
  
  float halfThickness = uThickness * 0.5;
  // Use smoothstep for an anti-aliased edge.
  float alpha = smoothstep(halfThickness, halfThickness - 1.0, d);
  fragColor = vec4(1.0, 0.0, 0.0, alpha);
}
`);
    this.prog = s, t.useProgram(s);
    const g = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), S = t.createVertexArray();
    this.vao = S, t.bindVertexArray(S);
    const m = t.createBuffer();
    t.bindBuffer(t.ARRAY_BUFFER, m), t.bufferData(t.ARRAY_BUFFER, g, t.STATIC_DRAW), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null);
    const v = t.getUniformLocation(s, "uPoints"), p = t.getUniformLocation(s, "uNumPoints"), f = t.getUniformLocation(s, "uThickness"), u = t.getUniformLocation(s, "uCanvasHeight"), R = new Float32Array([100, 100, 200, 150, 300, 100, 200, 200]), E = R.length / 2;
    t.uniform2fv(v, R), t.uniform1i(p, E), t.uniform1f(f, 10), t.uniform1f(u, this.height);
  }
  draw() {
    const e = this.gl, r = this.prog;
    e.viewport(0, 0, this.width, this.height), e.clearColor(0.9, 0.9, 0.9, 1), e.clear(e.COLOR_BUFFER_BIT), e.useProgram(r), e.bindVertexArray(this.vao), e.drawArrays(e.TRIANGLE_STRIP, 0, 4);
  }
}
class T {
  constructor(e, r) {
    /**
     * @private
     */
    i(this, "gl");
    i(this, "width");
    i(this, "height");
    /**
     * Global horizontal scale factor
     * @default = 1.0
     */
    i(this, "gScaleX");
    /**
     * Global vertical scale factor
     * @default = 1.0
     */
    i(this, "gScaleY");
    /**
     * Global X/Y scale ratio
     * @default = 1
     */
    i(this, "gXYratio");
    /**
     * Global horizontal offset
     * @default = 0
     */
    i(this, "gOffsetX");
    /**
     * Global vertical offset
     * @default = 0
     */
    i(this, "gOffsetY");
    /**
     * log debug output
     */
    i(this, "debug", !1);
    r == null ? this.gl = e.getContext("webgl2", {
      antialias: !0,
      transparent: !1
    }) : (this.gl = e.getContext("webgl2", {
      antialias: r.antialias,
      transparent: r.transparent,
      desynchronized: r.deSync,
      powerPerformance: r.powerPerformance,
      preserveDrawing: r.preserveDrawing
    }), this.debug = r.debug == null ? !1 : r.debug), this.log("canvas type is: " + e.constructor.name), this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`);
    const t = this.gl;
    this.gScaleX = 1, this.gScaleY = 1, this.gXYratio = 1, this.gOffsetX = 0, this.gOffsetY = 0, this.width = e.width, this.height = e.height, t.viewport(0, 0, e.width, e.height), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_DST_ALPHA), t.clearColor(0, 0, 0, 1), t.clear(t.COLOR_BUFFER_BIT);
  }
  /**
   * Draw and clear the canvas
   */
  update() {
    this.clear();
  }
  /**
   * Clear the canvas
   */
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  /**
   * remove all data lines
   */
  /**
   * Change the WbGL viewport
   * @param a
   * @param b
   * @param c
   * @param d
   */
  viewport(e, r, t, o) {
    this.gl.viewport(e, r, t, o);
  }
  log(e) {
    this.debug && console.log("[webgl-plot]:" + e);
  }
}
export {
  B as ColorRGBA,
  w as WebglAux,
  y as WebglLine,
  I as WebglLinePlot,
  U as WebglLineRoll,
  D as WebglLineThick,
  T as WebglPlot,
  C as WebglScatterAcc
};
