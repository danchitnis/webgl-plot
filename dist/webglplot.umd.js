(function(h,g){typeof exports=="object"&&typeof module<"u"?g(exports):typeof define=="function"&&define.amd?define(["exports"],g):(h=typeof globalThis<"u"?globalThis:h||self,g(h.webglplot={}))})(this,function(h){"use strict";var T=Object.defineProperty;var D=(h,g,v)=>g in h?T(h,g,{enumerable:!0,configurable:!0,writable:!0,value:v}):h[g]=v;var i=(h,g,v)=>D(h,typeof g!="symbol"?g+"":g,v);class g{constructor(r,e,t,o){i(this,"r");i(this,"g");i(this,"b");i(this,"a");this.r=r,this.g=e,this.b=t,this.a=o}toArray(){return[this.r,this.g,this.b,this.a]}}class v{constructor(r){i(this,"wglp");i(this,"lines");i(this,"gl");i(this,"coord");i(this,"vbuffer");i(this,"prog");this.wglp=r,this.gl=r.gl;const e=this.gl;this.lines=[];const t=`#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`,o=this.gl.createShader(this.gl.VERTEX_SHADER);if(!o)throw new Error("Error creating vertex shader");this.gl.shaderSource(o,t),this.gl.compileShader(o),e.getShaderParameter(o,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(o));const n=`#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`,a=this.gl.createShader(this.gl.FRAGMENT_SHADER);if(!a)throw new Error("Error creating fragment shader");this.gl.shaderSource(a,n),this.gl.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(a)),this.prog=this.gl.createProgram(),this.gl.attachShader(this.prog,o),this.gl.attachShader(this.prog,a),this.gl.linkProgram(this.prog),this.gl.useProgram(this.prog),this.vbuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.coord=this.gl.getAttribLocation(this.prog,"coord"),this.gl.vertexAttribPointer(this.coord,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(this.coord),e.useProgram(this.prog);const f=e.getUniformLocation(this.prog,"uscale");e.uniformMatrix2fv(f,!1,new Float32Array([this.wglp.gScaleX,0,0,this.wglp.gScaleY]));const s=e.getUniformLocation(this.prog,"uoffset");e.uniform2fv(s,new Float32Array([this.wglp.gOffsetX,this.wglp.gOffsetY]));const u=e.getUniformLocation(this.prog,"uColor");e.uniform4fv(u,[1,1,0,1])}addLine(r){this.lines.push(r)}draw(){this.gl.useProgram(this.prog),this.lines.forEach(r=>{this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(r.xy),this.gl.STREAM_DRAW);const e=this.gl.getUniformLocation(this.prog,"uColor");this.gl.uniform4f(e,r.color.r,r.color.g,r.color.b,r.color.a),this.gl.drawArrays(this.gl.LINE_STRIP,0,r.xy.length/2)})}}class F{constructor(r,e){i(this,"wglp");i(this,"headIndex",0);i(this,"color");i(this,"squareSize");i(this,"maxSquare");i(this,"gl");i(this,"squareIndices",new Uint16Array([0,1,2,2,1,3]));i(this,"colorsBuffer");i(this,"positionBuffer");i(this,"prog");i(this,"attrPosLocation");i(this,"attrColorLocation");this.wglp=r,this.color=new g(1,1,1,1),this.squareSize=.1,this.maxSquare=e,this.gl=r.gl;const t=this.gl,o=t.createShader(t.VERTEX_SHADER);if(!o)throw new Error("Unable to create vertex shader");t.shaderSource(o,`#version 300 es

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

`),t.compileShader(o),t.getShaderParameter(o,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(o));const n=t.createShader(t.FRAGMENT_SHADER);if(!n)throw new Error("Unable to create fragment shader");t.shaderSource(n,`#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(n));const a=t.createProgram();t.attachShader(a,o),t.attachShader(a,n),t.linkProgram(a),t.useProgram(a),this.prog=a;const f=t.createBuffer();t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,f),t.bufferData(t.ELEMENT_ARRAY_BUFFER,this.squareIndices,t.STATIC_DRAW);const s=new Float32Array(Array.from({length:this.maxSquare*2},()=>0));this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferData(t.ARRAY_BUFFER,s,t.DYNAMIC_DRAW),this.attrPosLocation=t.getAttribLocation(this.prog,"position"),t.vertexAttribPointer(this.attrPosLocation,2,t.FLOAT,!1,0,0),t.vertexAttribDivisor(this.attrPosLocation,1),t.enableVertexAttribArray(this.attrPosLocation);const u=new Uint8Array(Array.from({length:this.maxSquare*3},()=>255));this.colorsBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferData(t.ARRAY_BUFFER,u,t.DYNAMIC_DRAW),this.attrColorLocation=t.getAttribLocation(this.prog,"sColor"),t.vertexAttribPointer(this.attrColorLocation,3,t.UNSIGNED_BYTE,!1,0,0),t.vertexAttribDivisor(this.attrColorLocation,1),t.enableVertexAttribArray(this.attrColorLocation),this.setScale(1,1),this.setOffset(0,0)}setColor(r){this.color=r;const e=this.gl.getUniformLocation(this.prog,"u_color");this.gl.uniform4f(e,r.r,r.g,r.b,r.a)}setSquareSize(r){this.squareSize=r;const e=this.gl.getUniformLocation(this.prog,"u_size");this.gl.uniform1f(e,this.squareSize)}setScale(r,e){const t=this.gl.getUniformLocation(this.prog,"u_scale");this.gl.uniformMatrix2fv(t,!1,[r*this.wglp.gScaleX,0,0,e*this.wglp.gScaleY])}setOffset(r,e){const t=this.gl.getUniformLocation(this.prog,"u_offset");this.gl.uniform2f(t,r+this.wglp.gOffsetX,e+this.wglp.gOffsetY)}addSquare(r,e){const t=this.gl;t.useProgram(this.prog),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*2*4,r,0,r.length),t.enableVertexAttribArray(this.attrPosLocation),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*3*1,e,0,e.length),t.enableVertexAttribArray(this.attrColorLocation),this.headIndex=(this.headIndex+r.length/2)%this.maxSquare}draw(){this.gl.useProgram(this.prog),this.gl.drawElementsInstanced(this.gl.TRIANGLES,this.squareIndices.length,this.gl.UNSIGNED_SHORT,0,this.maxSquare)}}class P{constructor(r,e){i(this,"xy",[]);i(this,"color");r===void 0&&(r=[0,0,1,1]),e===void 0&&(e=new g(1,1,1,1)),this.xy=r,this.color=e}getSize(){return this.xy.length/2}setY(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r}setYs(r){if(r.length==this.xy.length/2)for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r[e/2];else throw new Error("mismatch in array length")}setXYArray(r){this.xy=r}setX(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e]=r}lineSpaceX(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=2*t/e-1,this.xy[t*2+1]=0}emptyLine(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(r){this.color=r}}class x{constructor(r,e,t){i(this,"gl");i(this,"aPositionLocation");i(this,"vertexBuffer");i(this,"program");i(this,"rollBufferSize");i(this,"shift");i(this,"dataIndex");i(this,"dataX");i(this,"lastDataX");i(this,"lastDataY");i(this,"numLines");i(this,"ext");i(this,"colorBuffer");i(this,"aColorLocation");i(this,"uShiftLocation");this.gl=r.gl,this.rollBufferSize=e,this.shift=0,this.dataIndex=0,this.dataX=1,this.lastDataX=Array(t).fill(0),this.lastDataY=Array(t).fill(0),this.numLines=t;const o=this.gl;this.ext=o.getExtension("WEBGL_multi_draw");const n=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color/ vec3(255.0, 255.0, 255.0);
        }`,a=o.createShader(o.VERTEX_SHADER);if(!a)throw new Error("Failed to create vertex shader");o.shaderSource(a,n),o.compileShader(a),o.getShaderParameter(a,o.COMPILE_STATUS)||console.error(o.getShaderInfoLog(a));const f=`#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`,s=o.createShader(o.FRAGMENT_SHADER);if(!s)throw new Error("Failed to create fragment shader");o.shaderSource(s,f),o.compileShader(s),o.getShaderParameter(s,o.COMPILE_STATUS)||console.error(o.getShaderInfoLog(s)),this.program=o.createProgram(),o.attachShader(this.program,a),o.attachShader(this.program,s),o.linkProgram(this.program),o.getProgramParameter(this.program,o.LINK_STATUS)||console.error(o.getProgramInfoLog(this.program)),this.vertexBuffer=o.createBuffer(),o.bindBuffer(o.ARRAY_BUFFER,this.vertexBuffer),o.bufferData(o.ARRAY_BUFFER,new Float32Array((this.rollBufferSize+2)*2*t),o.DYNAMIC_DRAW),this.aPositionLocation=o.getAttribLocation(this.program,"a_position"),o.vertexAttribPointer(this.aPositionLocation,2,o.FLOAT,!1,0,0),o.enableVertexAttribArray(this.aPositionLocation),this.colorBuffer=o.createBuffer();const u=Array((this.rollBufferSize+2)*3*t).fill(128);o.bindBuffer(this.gl.ARRAY_BUFFER,this.colorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Uint8Array(u),o.STATIC_DRAW),this.aColorLocation=o.getAttribLocation(this.program,"a_color"),o.vertexAttribPointer(this.aColorLocation,3,o.UNSIGNED_BYTE,!1,0,0),o.enableVertexAttribArray(this.aColorLocation),this.uShiftLocation=o.getUniformLocation(this.program,"uShift")}addPoint(r){const e=this.gl,t=this.rollBufferSize+2;this.shift+=2/this.rollBufferSize,this.dataX+=2/this.rollBufferSize,e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);for(let o=0;o<this.numLines;o++)e.bufferSubData(e.ARRAY_BUFFER,(this.dataIndex+t*o)*2*4,new Float32Array([this.dataX,r[o]]));if(e.enableVertexAttribArray(this.aPositionLocation),this.dataIndex===this.rollBufferSize-1)for(let o=0;o<this.numLines;o++)this.lastDataX[o]=this.dataX,this.lastDataY[o]=r[o];if(this.dataIndex===0&&this.lastDataX[0]!==0)for(let o=0;o<this.numLines;o++)e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+t*o)*2*4,new Float32Array([this.lastDataX[o],this.lastDataY[o],this.dataX,r[o]]));this.dataIndex=(this.dataIndex+1)%this.rollBufferSize}addPoints(r){const e=this.gl,t=this.rollBufferSize+2;e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);let o=this.dataIndex,n=0;for(let a=0;a<r.length;a++){o=this.dataIndex,n=0;for(let f=0;f<r[a].length;f++){const s=this.dataX+f*2/this.rollBufferSize;if(o<this.rollBufferSize&&e.bufferSubData(e.ARRAY_BUFFER,(o+a*t)*2*4,new Float32Array([s,r[a][f]])),o===this.rollBufferSize-1&&(this.lastDataX[a]=s,this.lastDataY[a]=r[a][f]),o%this.rollBufferSize===0&&this.lastDataX[a]!==0&&e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+a*t)*2*4,new Float32Array([this.lastDataX[a],this.lastDataY[a],s,r[a][f]])),o>=this.rollBufferSize){const u=o%this.rollBufferSize;e.bufferSubData(e.ARRAY_BUFFER,(u+a*t)*2*4,new Float32Array([s,r[a][f]]))}o++,n=s}}this.shift+=r[0].length*2/this.rollBufferSize,this.dataX=n+2/this.rollBufferSize,this.dataIndex=o%this.rollBufferSize,e.enableVertexAttribArray(this.aPositionLocation)}drawOld(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);for(let t=0;t<this.numLines;t++)e.drawArrays(e.LINE_STRIP,t*r,this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.dataIndex,this.rollBufferSize-this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.rollBufferSize,2)}drawExt(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);const t=[],o=[];for(let n=0;n<this.numLines;n++)t.push(n*r),o.push(this.dataIndex),t.push(n*r+this.dataIndex),o.push(this.rollBufferSize-this.dataIndex),t.push(n*r+this.rollBufferSize),o.push(2);if(!this.ext)throw new Error("Multi draw extension not available");this.ext.multiDrawArraysWEBGL(e.LINE_STRIP,t,0,o,0,o.length)}draw(){this.ext?this.drawExt():this.drawOld()}setLineColor(r,e){const t=this.gl;t.useProgram(this.program),t.bindBuffer(t.ARRAY_BUFFER,this.colorBuffer);const o=[];for(let n=0;n<this.rollBufferSize+2;n++)o.push(r.r),o.push(r.g),o.push(r.b);t.bufferSubData(t.ARRAY_BUFFER,(this.rollBufferSize+2)*3*e*1,new Uint8Array(o)),t.enableVertexAttribArray(this.aColorLocation)}}class w{constructor(r,e){i(this,"lines");i(this,"gl");i(this,"coord");i(this,"vertexBuffer");i(this,"prog");i(this,"lineSizes");i(this,"totalLineSizes");i(this,"lineSizeAccum");i(this,"updateLine",r=>{const e=this.gl;e.useProgram(this.prog),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferSubData(e.ARRAY_BUFFER,4*2*this.lineSizeAccum[r],new Float32Array(this.lines[r].xy)),e.enableVertexAttribArray(this.coord)});i(this,"draw",()=>{const r=this.gl;r.useProgram(this.prog);for(let e=0;e<this.lineSizes.length;e++)r.drawArrays(r.LINE_STRIP,this.lineSizeAccum[e],this.lineSizes[e])});this.gl=r.gl;const t=this.gl;this.lines=e;const o=e.map(c=>c.xy.length/2);this.lineSizes=o;const n=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_Color;
      
        out vec3 vColor;
      
        void main() {
            vColor = a_Color;
            gl_Position = vec4(a_position, 0, 1);
        }`,a=t.createShader(t.VERTEX_SHADER);if(!a)throw new Error("Error creating vertex shader");t.shaderSource(a,n),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(a));const f=`#version 300 es
        precision mediump float;
        in vec3 vColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(vColor,0.8);
        }`,s=t.createShader(t.FRAGMENT_SHADER);if(!s)throw new Error("Error creating fragment shader");t.shaderSource(s,f),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(s)),this.prog=t.createProgram(),t.attachShader(this.prog,a),t.attachShader(this.prog,s),t.linkProgram(this.prog),t.useProgram(this.prog);const u=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,u),this.totalLineSizes=o.reduce((c,d)=>c+d,0),this.lineSizeAccum=o.reduce((c,d)=>(c.push(c[c.length-1]+d),c),[0]).splice(0,o.length);const R=Array.from({length:o.length},()=>[Math.random(),Math.random(),Math.random()]);let p=Array.from({length:o[0]},(c,d)=>d).flatMap(()=>R[0]);for(let c=1;c<o.length;c++)p=p.concat(Array.from({length:o[c]},(d,_)=>_).flatMap(()=>R[c]));t.bufferData(t.ARRAY_BUFFER,new Float32Array(p),t.DYNAMIC_DRAW);const b=t.getAttribLocation(this.prog,"a_Color");t.vertexAttribPointer(b,3,t.FLOAT,!1,0,0),t.enableVertexAttribArray(b),this.vertexBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),this.coord=t.getAttribLocation(this.prog,"a_position"),t.vertexAttribPointer(this.coord,2,t.FLOAT,!1,0,0),t.enableVertexAttribArray(this.coord);const B=new Float32Array(this.totalLineSizes*2);t.bufferData(t.ARRAY_BUFFER,new Float32Array(B),t.DYNAMIC_DRAW),t.clearColor(.1,.1,.1,1),t.clear(t.COLOR_BUFFER_BIT),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.viewport(0,0,r.width,r.height)}}class C{constructor(r,e){i(this,"line");i(this,"gl");i(this,"prog");i(this,"width");i(this,"height");i(this,"vao");this.gl=r.gl;const t=this.gl;this.line=e,this.width=r.width,this.height=r.height;function o(l,L,E){const A=l.createShader(L);if(!A)throw new Error("Could not create shader");if(l.shaderSource(A,E),l.compileShader(A),!l.getShaderParameter(A,l.COMPILE_STATUS))throw new Error("Shader compile error: "+l.getShaderInfoLog(A));return A}function n(l,L,E){const A=o(l,l.VERTEX_SHADER,L),I=o(l,l.FRAGMENT_SHADER,E),m=l.createProgram();if(!m)throw new Error("Could not create program");if(l.attachShader(m,A),l.attachShader(m,I),l.linkProgram(m),!l.getProgramParameter(m,l.LINK_STATUS))throw new Error("Program link error: "+l.getProgramInfoLog(m));return m}const s=n(t,`#version 300 es
precision mediump float;
layout(location=0) in vec2 aPosition;
out vec2 vUV;
void main() {
  // Convert NDC to [0,1] UV (optional, not strictly used in our distance calc).
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,`#version 300 es
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
`);this.prog=s,t.useProgram(s);const u=new Float32Array([-1,-1,1,-1,-1,1,1,1]),R=t.createVertexArray();this.vao=R,t.bindVertexArray(R);const p=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,p),t.bufferData(t.ARRAY_BUFFER,u,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null);const b=t.getUniformLocation(s,"uPoints"),B=t.getUniformLocation(s,"uNumPoints"),c=t.getUniformLocation(s,"uThickness"),d=t.getUniformLocation(s,"uCanvasHeight"),_=new Float32Array([100,100,200,150,300,100,200,200]),U=_.length/2;t.uniform2fv(b,_),t.uniform1i(B,U),t.uniform1f(c,10),t.uniform1f(d,this.height)}draw(){const r=this.gl,e=this.prog;r.viewport(0,0,this.width,this.height),r.clearColor(.9,.9,.9,1),r.clear(r.COLOR_BUFFER_BIT),r.useProgram(e),r.bindVertexArray(this.vao),r.drawArrays(r.TRIANGLE_STRIP,0,4)}}class y{constructor(r,e){i(this,"gl");i(this,"width");i(this,"height");i(this,"gScaleX");i(this,"gScaleY");i(this,"gXYratio");i(this,"gOffsetX");i(this,"gOffsetY");i(this,"debug",!1);e==null?this.gl=r.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=r.getContext("webgl2",{antialias:e.antialias,transparent:e.transparent,desynchronized:e.deSync,powerPerformance:e.powerPerformance,preserveDrawing:e.preserveDrawing}),this.debug=e.debug==null?!1:e.debug),this.log("canvas type is: "+r.constructor.name),this.log(`[webgl-plot]:width=${r.width}, height=${r.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=r.width,this.height=r.height,t.viewport(0,0,r.width,r.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(r,e,t,o){this.gl.viewport(r,e,t,o)}log(r){this.debug&&console.log("[webgl-plot]:"+r)}}h.ColorRGBA=g,h.WebglAux=v,h.WebglLine=P,h.WebglLinePlot=w,h.WebglLineRoll=x,h.WebglLineThick=C,h.WebglPlot=y,h.WebglScatterAcc=F,Object.defineProperty(h,Symbol.toStringTag,{value:"Module"})});
