(function(f,g){typeof exports=="object"&&typeof module<"u"?g(exports):typeof define=="function"&&define.amd?define(["exports"],g):(f=typeof globalThis<"u"?globalThis:f||self,g(f.webglplot={}))})(this,function(f){"use strict";var y=Object.defineProperty;var U=(f,g,x)=>g in f?y(f,g,{enumerable:!0,configurable:!0,writable:!0,value:x}):f[g]=x;var o=(f,g,x)=>U(f,typeof g!="symbol"?g+"":g,x);class g{constructor(r,e,t,i){o(this,"r");o(this,"g");o(this,"b");o(this,"a");this.r=r,this.g=e,this.b=t,this.a=i}toArray(){return[this.r,this.g,this.b,this.a]}}class x{constructor(r){o(this,"wglp");o(this,"lines");o(this,"gl");o(this,"coord");o(this,"vbuffer");o(this,"prog");this.wglp=r,this.gl=r.gl;const e=this.gl;this.lines=[];const t=`#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`,i=this.gl.createShader(this.gl.VERTEX_SHADER);if(!i)throw new Error("Error creating vertex shader");this.gl.shaderSource(i,t),this.gl.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(i));const l=`#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`,a=this.gl.createShader(this.gl.FRAGMENT_SHADER);if(!a)throw new Error("Error creating fragment shader");this.gl.shaderSource(a,l),this.gl.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(a)),this.prog=this.gl.createProgram(),this.gl.attachShader(this.prog,i),this.gl.attachShader(this.prog,a),this.gl.linkProgram(this.prog),this.gl.useProgram(this.prog),this.vbuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.coord=this.gl.getAttribLocation(this.prog,"coord"),this.gl.vertexAttribPointer(this.coord,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(this.coord),e.useProgram(this.prog);const h=e.getUniformLocation(this.prog,"uscale");e.uniformMatrix2fv(h,!1,new Float32Array([this.wglp.gScaleX,0,0,this.wglp.gScaleY]));const s=e.getUniformLocation(this.prog,"uoffset");e.uniform2fv(s,new Float32Array([this.wglp.gOffsetX,this.wglp.gOffsetY]));const c=e.getUniformLocation(this.prog,"uColor");e.uniform4fv(c,[1,1,0,1])}addLine(r){this.lines.push(r)}draw(){this.gl.useProgram(this.prog),this.lines.forEach(r=>{this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(r.xy),this.gl.STREAM_DRAW);const e=this.gl.getUniformLocation(this.prog,"uColor");this.gl.uniform4f(e,r.color.r,r.color.g,r.color.b,r.color.a),this.gl.drawArrays(this.gl.LINE_STRIP,0,r.xy.length/2)})}}class T{constructor(r,e){o(this,"wglp");o(this,"headIndex",0);o(this,"color");o(this,"squareSize");o(this,"maxSquare");o(this,"gl");o(this,"squareIndices",new Uint16Array([0,1,2,2,1,3]));o(this,"colorsBuffer");o(this,"positionBuffer");o(this,"prog");o(this,"attrPosLocation");o(this,"attrColorLocation");this.wglp=r,this.color=new g(1,1,1,1),this.squareSize=.1,this.maxSquare=e,this.gl=r.gl;const t=this.gl,i=t.createShader(t.VERTEX_SHADER);if(!i)throw new Error("Unable to create vertex shader");t.shaderSource(i,`#version 300 es

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

`),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(i));const l=t.createShader(t.FRAGMENT_SHADER);if(!l)throw new Error("Unable to create fragment shader");t.shaderSource(l,`#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`),t.compileShader(l),t.getShaderParameter(l,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(l));const a=t.createProgram();t.attachShader(a,i),t.attachShader(a,l),t.linkProgram(a),t.useProgram(a),this.prog=a;const h=t.createBuffer();t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,h),t.bufferData(t.ELEMENT_ARRAY_BUFFER,this.squareIndices,t.STATIC_DRAW);const s=new Float32Array(Array.from({length:this.maxSquare*2},()=>0));this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferData(t.ARRAY_BUFFER,s,t.DYNAMIC_DRAW),this.attrPosLocation=t.getAttribLocation(this.prog,"position"),t.vertexAttribPointer(this.attrPosLocation,2,t.FLOAT,!1,0,0),t.vertexAttribDivisor(this.attrPosLocation,1),t.enableVertexAttribArray(this.attrPosLocation);const c=new Uint8Array(Array.from({length:this.maxSquare*3},()=>255));this.colorsBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferData(t.ARRAY_BUFFER,c,t.DYNAMIC_DRAW),this.attrColorLocation=t.getAttribLocation(this.prog,"sColor"),t.vertexAttribPointer(this.attrColorLocation,3,t.UNSIGNED_BYTE,!1,0,0),t.vertexAttribDivisor(this.attrColorLocation,1),t.enableVertexAttribArray(this.attrColorLocation),this.setScale(1,1),this.setOffset(0,0)}setColor(r){this.color=r;const e=this.gl.getUniformLocation(this.prog,"u_color");this.gl.uniform4f(e,r.r,r.g,r.b,r.a)}setSquareSize(r){this.squareSize=r;const e=this.gl.getUniformLocation(this.prog,"u_size");this.gl.uniform1f(e,this.squareSize)}setScale(r,e){const t=this.gl.getUniformLocation(this.prog,"u_scale");this.gl.uniformMatrix2fv(t,!1,[r*this.wglp.gScaleX,0,0,e*this.wglp.gScaleY])}setOffset(r,e){const t=this.gl.getUniformLocation(this.prog,"u_offset");this.gl.uniform2f(t,r+this.wglp.gOffsetX,e+this.wglp.gOffsetY)}addSquare(r,e){const t=this.gl;t.useProgram(this.prog),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*2*4,r,0,r.length),t.enableVertexAttribArray(this.attrPosLocation),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*3*1,e,0,e.length),t.enableVertexAttribArray(this.attrColorLocation),this.headIndex=(this.headIndex+r.length/2)%this.maxSquare}draw(){this.gl.useProgram(this.prog),this.gl.drawElementsInstanced(this.gl.TRIANGLES,this.squareIndices.length,this.gl.UNSIGNED_SHORT,0,this.maxSquare)}}class B{constructor(r,e){o(this,"xy",[]);o(this,"color");r===void 0&&(r=[0,0,1,1]),e===void 0&&(e=new g(1,1,1,1)),this.xy=r,this.color=e}getSize(){return this.xy.length/2}setY(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r}setYs(r){if(r.length==this.xy.length/2)for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r[e/2];else throw new Error("mismatch in array length")}setXYArray(r){this.xy=r}setX(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e]=r}lineSpaceX(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=2*t/e-1,this.xy[t*2+1]=0}emptyLine(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(r){this.color=r}}class F{constructor(r,e,t){o(this,"gl");o(this,"aPositionLocation");o(this,"vertexBuffer");o(this,"program");o(this,"rollBufferSize");o(this,"shift");o(this,"dataIndex");o(this,"dataX");o(this,"lastDataX");o(this,"lastDataY");o(this,"numLines");o(this,"ext");o(this,"colorBuffer");o(this,"aColorLocation");o(this,"uShiftLocation");this.gl=r.gl,this.rollBufferSize=e,this.shift=0,this.dataIndex=0,this.dataX=1,this.lastDataX=Array(t).fill(0),this.lastDataY=Array(t).fill(0),this.numLines=t;const i=this.gl;this.ext=i.getExtension("WEBGL_multi_draw");const l=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color/ vec3(255.0, 255.0, 255.0);
        }`,a=i.createShader(i.VERTEX_SHADER);if(!a)throw new Error("Failed to create vertex shader");i.shaderSource(a,l),i.compileShader(a),i.getShaderParameter(a,i.COMPILE_STATUS)||console.error(i.getShaderInfoLog(a));const h=`#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`,s=i.createShader(i.FRAGMENT_SHADER);if(!s)throw new Error("Failed to create fragment shader");i.shaderSource(s,h),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)||console.error(i.getShaderInfoLog(s)),this.program=i.createProgram(),i.attachShader(this.program,a),i.attachShader(this.program,s),i.linkProgram(this.program),i.getProgramParameter(this.program,i.LINK_STATUS)||console.error(i.getProgramInfoLog(this.program)),this.vertexBuffer=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,new Float32Array((this.rollBufferSize+2)*2*t),i.DYNAMIC_DRAW),this.aPositionLocation=i.getAttribLocation(this.program,"a_position"),i.vertexAttribPointer(this.aPositionLocation,2,i.FLOAT,!1,0,0),i.enableVertexAttribArray(this.aPositionLocation),this.colorBuffer=i.createBuffer();const c=Array((this.rollBufferSize+2)*3*t).fill(128);i.bindBuffer(this.gl.ARRAY_BUFFER,this.colorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Uint8Array(c),i.STATIC_DRAW),this.aColorLocation=i.getAttribLocation(this.program,"a_color"),i.vertexAttribPointer(this.aColorLocation,3,i.UNSIGNED_BYTE,!1,0,0),i.enableVertexAttribArray(this.aColorLocation),this.uShiftLocation=i.getUniformLocation(this.program,"uShift")}addPoint(r){const e=this.gl,t=this.rollBufferSize+2;this.shift+=2/this.rollBufferSize,this.dataX+=2/this.rollBufferSize,e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);for(let i=0;i<this.numLines;i++)e.bufferSubData(e.ARRAY_BUFFER,(this.dataIndex+t*i)*2*4,new Float32Array([this.dataX,r[i]]));if(e.enableVertexAttribArray(this.aPositionLocation),this.dataIndex===this.rollBufferSize-1)for(let i=0;i<this.numLines;i++)this.lastDataX[i]=this.dataX,this.lastDataY[i]=r[i];if(this.dataIndex===0&&this.lastDataX[0]!==0)for(let i=0;i<this.numLines;i++)e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+t*i)*2*4,new Float32Array([this.lastDataX[i],this.lastDataY[i],this.dataX,r[i]]));this.dataIndex=(this.dataIndex+1)%this.rollBufferSize}addPoints(r){const e=this.gl,t=this.rollBufferSize+2;e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);let i=this.dataIndex,l=0;for(let a=0;a<r.length;a++){i=this.dataIndex,l=0;for(let h=0;h<r[a].length;h++){const s=this.dataX+h*2/this.rollBufferSize;if(i<this.rollBufferSize&&e.bufferSubData(e.ARRAY_BUFFER,(i+a*t)*2*4,new Float32Array([s,r[a][h]])),i===this.rollBufferSize-1&&(this.lastDataX[a]=s,this.lastDataY[a]=r[a][h]),i%this.rollBufferSize===0&&this.lastDataX[a]!==0&&e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+a*t)*2*4,new Float32Array([this.lastDataX[a],this.lastDataY[a],s,r[a][h]])),i>=this.rollBufferSize){const c=i%this.rollBufferSize;e.bufferSubData(e.ARRAY_BUFFER,(c+a*t)*2*4,new Float32Array([s,r[a][h]]))}i++,l=s}}this.shift+=r[0].length*2/this.rollBufferSize,this.dataX=l+2/this.rollBufferSize,this.dataIndex=i%this.rollBufferSize,e.enableVertexAttribArray(this.aPositionLocation)}drawOld(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);for(let t=0;t<this.numLines;t++)e.drawArrays(e.LINE_STRIP,t*r,this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.dataIndex,this.rollBufferSize-this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.rollBufferSize,2)}drawExt(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);const t=[],i=[];for(let l=0;l<this.numLines;l++)t.push(l*r),i.push(this.dataIndex),t.push(l*r+this.dataIndex),i.push(this.rollBufferSize-this.dataIndex),t.push(l*r+this.rollBufferSize),i.push(2);if(!this.ext)throw new Error("Multi draw extension not available");this.ext.multiDrawArraysWEBGL(e.LINE_STRIP,t,0,i,0,i.length)}draw(){this.ext?this.drawExt():this.drawOld()}setLineColor(r,e){const t=this.gl;t.useProgram(this.program),t.bindBuffer(t.ARRAY_BUFFER,this.colorBuffer);const i=[];for(let l=0;l<this.rollBufferSize+2;l++)i.push(r.r),i.push(r.g),i.push(r.b);t.bufferSubData(t.ARRAY_BUFFER,(this.rollBufferSize+2)*3*e*1,new Uint8Array(i)),t.enableVertexAttribArray(this.aColorLocation)}}class w{constructor(r,e){o(this,"lines");o(this,"gl");o(this,"coord");o(this,"vertexBuffer");o(this,"prog");o(this,"lineSizes");o(this,"totalLineSizes");o(this,"lineSizeAccum");o(this,"updateLine",r=>{const e=this.gl;e.useProgram(this.prog),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferSubData(e.ARRAY_BUFFER,4*2*this.lineSizeAccum[r],new Float32Array(this.lines[r].xy)),e.enableVertexAttribArray(this.coord)});o(this,"draw",()=>{const r=this.gl;r.useProgram(this.prog);for(let e=0;e<this.lineSizes.length;e++)r.drawArrays(r.LINE_STRIP,this.lineSizeAccum[e],this.lineSizes[e])});this.gl=r.gl;const t=this.gl;this.lines=e;const i=e.map(u=>u.xy.length/2);this.lineSizes=i;const l=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_Color;
      
        out vec3 vColor;
      
        void main() {
            vColor = a_Color;
            gl_Position = vec4(a_position, 0, 1);
        }`,a=t.createShader(t.VERTEX_SHADER);if(!a)throw new Error("Error creating vertex shader");t.shaderSource(a,l),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(a));const h=`#version 300 es
        precision mediump float;
        in vec3 vColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(vColor,0.8);
        }`,s=t.createShader(t.FRAGMENT_SHADER);if(!s)throw new Error("Error creating fragment shader");t.shaderSource(s,h),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(s)),this.prog=t.createProgram(),t.attachShader(this.prog,a),t.attachShader(this.prog,s),t.linkProgram(this.prog),t.useProgram(this.prog);const c=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,c),this.totalLineSizes=i.reduce((u,L)=>u+L,0),this.lineSizeAccum=i.reduce((u,L)=>(u.push(u[u.length-1]+L),u),[0]).splice(0,i.length);const m=Array.from({length:i.length},()=>[Math.random(),Math.random(),Math.random()]);let d=Array.from({length:i[0]},(u,L)=>L).flatMap(()=>m[0]);for(let u=1;u<i.length;u++)d=d.concat(Array.from({length:i[u]},(L,v)=>v).flatMap(()=>m[u]));t.bufferData(t.ARRAY_BUFFER,new Float32Array(d),t.DYNAMIC_DRAW);const S=t.getAttribLocation(this.prog,"a_Color");t.vertexAttribPointer(S,3,t.FLOAT,!1,0,0),t.enableVertexAttribArray(S),this.vertexBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),this.coord=t.getAttribLocation(this.prog,"a_position"),t.vertexAttribPointer(this.coord,2,t.FLOAT,!1,0,0),t.enableVertexAttribArray(this.coord);const A=new Float32Array(this.totalLineSizes*2);t.bufferData(t.ARRAY_BUFFER,new Float32Array(A),t.DYNAMIC_DRAW),t.clearColor(.1,.1,.1,1),t.clear(t.COLOR_BUFFER_BIT),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.viewport(0,0,r.width,r.height)}}const b=10;class C{constructor(r,e){o(this,"gl");o(this,"prog");o(this,"thickness");o(this,"pointsTexture");o(this,"vao");o(this,"vertexBuffer");o(this,"locations");o(this,"lineDrawCalls",[]);o(this,"totalVertexCount",0);o(this,"numLines",0);o(this,"currentLineScale",new Float32Array(0));o(this,"currentLineOffset",new Float32Array(0));o(this,"currentLineColor",new Float32Array(0));this.gl=r.gl,this.thickness=e;const t=this.gl,i=`#version 300 es
precision mediump float;
#define MAX_LINES ${b}

uniform sampler2D uPointsTex;
uniform float uThickness;
uniform int uTexWidth;
uniform int uTexHeight;

// Per-line metadata arrays.
uniform int uNumLines;
uniform int uLineStart[MAX_LINES];
uniform int uLineNumPoints[MAX_LINES];
uniform vec2 uLineScale[MAX_LINES];
uniform vec2 uLineOffset[MAX_LINES];
uniform vec4 uLineColor[MAX_LINES];

in float aLineId;  // which line (index)
in float aIndex;   // index within that line
in float aSide;    // +1.0 or -1.0

// Use flat interpolation for the line color.
flat out vec4 vColor;

vec2 getPoint(int idx) {
  int texX = idx % uTexWidth;
  int texY = idx / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex);
  int globalIndex = uLineStart[lineId] + localIndex;
  int numPoints = uLineNumPoints[lineId];

  // Retrieve the current point and its neighbors.
  vec2 p = getPoint(globalIndex);
  vec2 pPrev = (localIndex == 0) ? p : getPoint(uLineStart[lineId] + localIndex - 1);
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(uLineStart[lineId] + localIndex + 1);
  
  // Apply per-line transformation (scale and offset are in ND).
  p = p * uLineScale[lineId] + uLineOffset[lineId];
  pPrev = pPrev * uLineScale[lineId] + uLineOffset[lineId];
  pNext = pNext * uLineScale[lineId] + uLineOffset[lineId];

  vec2 offsetNormal;
  if(localIndex == 0) {
    vec2 dir = normalize(pNext - p);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else if(localIndex == numPoints - 1) {
    vec2 dir = normalize(p - pPrev);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else {
    vec2 dir0 = normalize(p - pPrev);
    vec2 dir1 = normalize(pNext - p);
    vec2 n0 = vec2(-dir0.y, dir0.x);
    vec2 n1 = vec2(-dir1.y, dir1.x);
    vec2 miter = normalize(n0 + n1);
    float rawMiterScale = uThickness * 0.5 / max(dot(miter, n1), 0.001);
    float miterLimit = 4.0;
    float miterScale = min(rawMiterScale, miterLimit);
    offsetNormal = miter * miterScale;
  }
  
  vec2 pos = p + offsetNormal * aSide;
  gl_Position = vec4(pos, 0.0, 1.0);

  // Fetch the color for this line.
  vColor = uLineColor[lineId];
}
`,l=`#version 300 es
precision mediump float;
flat in vec4 vColor;
out vec4 fragColor;
void main() {
  fragColor = vColor;
}
`;function a(s,c,m){const d=s.createShader(c);if(!d)throw new Error("Could not create shader");if(s.shaderSource(d,m),s.compileShader(d),!s.getShaderParameter(d,s.COMPILE_STATUS))throw new Error("Shader compile error: "+s.getShaderInfoLog(d));return d}function h(s,c,m){const d=a(s,s.VERTEX_SHADER,c),S=a(s,s.FRAGMENT_SHADER,m),A=s.createProgram();if(!A)throw new Error("Could not create program");if(s.attachShader(A,d),s.attachShader(A,S),s.linkProgram(A),!s.getProgramParameter(A,s.LINK_STATUS))throw new Error("Program link error: "+s.getProgramInfoLog(A));return A}this.prog=h(t,i,l),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,12,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,12,4),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,12,8),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight"),uNumLines:t.getUniformLocation(this.prog,"uNumLines"),uLineStart:t.getUniformLocation(this.prog,"uLineStart[0]"),uLineNumPoints:t.getUniformLocation(this.prog,"uLineNumPoints[0]"),uLineScale:t.getUniformLocation(this.prog,"uLineScale[0]"),uLineOffset:t.getUniformLocation(this.prog,"uLineOffset[0]"),uLineColor:t.getUniformLocation(this.prog,"uLineColor[0]")},t.useProgram(this.prog),t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uThickness,this.thickness),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}updateLines(r){const e=this.gl;if(r.length>b)throw new Error(`This shader supports up to ${b} lines.`);this.numLines=r.length;let t=0;const i=new Int32Array(r.length),l=new Int32Array(r.length),a=new Float32Array(r.length*2),h=new Float32Array(r.length*2),s=new Float32Array(r.length*4);for(let n=0;n<r.length;n++){i[n]=t;const E=r[n].points.length/2;l[n]=E,t+=E,a[n*2+0]=r[n].scale[0],a[n*2+1]=r[n].scale[1],h[n*2+0]=r[n].offset[0],h[n*2+1]=r[n].offset[1],s[n*4+0]=r[n].color[0],s[n*4+1]=r[n].color[1],s[n*4+2]=r[n].color[2],s[n*4+3]=r[n].color[3]}this.currentLineScale=a,this.currentLineOffset=h,this.currentLineColor=s;const c=new Float32Array(t*2);let m=0;for(let n=0;n<r.length;n++)c.set(r[n].points,m),m+=r[n].points.length;e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.pointsTexture);const d=e.getParameter(e.MAX_TEXTURE_SIZE),S=Math.min(t,d),A=Math.ceil(t/S),u=S*A,L=new Float32Array(u*2);L.set(c),e.texImage2D(e.TEXTURE_2D,0,e.RG32F,S,A,0,e.RG,e.FLOAT,L);const v=new Float32Array(t*2*3);let p=0;this.lineDrawCalls=[];let P=0;for(let n=0;n<r.length;n++){const E=l[n];this.lineDrawCalls.push({offset:P,count:E*2});for(let _=0;_<E;_++)v[p++]=n,v[p++]=_,v[p++]=1,v[p++]=n,v[p++]=_,v[p++]=-1;P+=E*2}e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,v,e.STATIC_DRAW),e.useProgram(this.prog),e.uniform1i(this.locations.uTexWidth,S),e.uniform1i(this.locations.uTexHeight,A),e.uniform1i(this.locations.uNumLines,r.length),e.uniform1iv(this.locations.uLineStart,i),e.uniform1iv(this.locations.uLineNumPoints,l),e.uniform2fv(this.locations.uLineScale,a),e.uniform2fv(this.locations.uLineOffset,h),e.uniform4fv(this.locations.uLineColor,s)}updateLineTransform(r,e,t){if(r<0||r>=this.numLines)throw new Error(`Invalid lineId: ${r}`);this.currentLineScale[r*2+0]=e[0],this.currentLineScale[r*2+1]=e[1],this.currentLineOffset[r*2+0]=t[0],this.currentLineOffset[r*2+1]=t[1];const i=this.gl;i.useProgram(this.prog),i.uniform2fv(this.locations.uLineScale,this.currentLineScale),i.uniform2fv(this.locations.uLineOffset,this.currentLineOffset)}updateLineColor(r,e){if(r<0||r>=this.numLines)throw new Error(`Invalid lineId: ${r}`);this.currentLineColor[r*4+0]=e[0],this.currentLineColor[r*4+1]=e[1],this.currentLineColor[r*4+2]=e[2],this.currentLineColor[r*4+3]=e[3];const t=this.gl;t.useProgram(this.prog),t.uniform4fv(this.locations.uLineColor,this.currentLineColor)}draw(){const r=this.gl;r.clear(r.COLOR_BUFFER_BIT),r.useProgram(this.prog),r.bindVertexArray(this.vao);for(let e=0;e<this.lineDrawCalls.length;e++){const{offset:t,count:i}=this.lineDrawCalls[e];r.drawArrays(r.TRIANGLE_STRIP,t,i)}}}class I{constructor(r,e){o(this,"gl");o(this,"width");o(this,"height");o(this,"gScaleX");o(this,"gScaleY");o(this,"gXYratio");o(this,"gOffsetX");o(this,"gOffsetY");o(this,"debug",!1);e==null?this.gl=r.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=r.getContext("webgl2",{antialias:e.antialias,transparent:e.transparent,desynchronized:e.deSync,powerPerformance:e.powerPerformance,preserveDrawing:e.preserveDrawing}),this.debug=e.debug==null?!1:e.debug),this.log("canvas type is: "+r.constructor.name),this.log(`[webgl-plot]:width=${r.width}, height=${r.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=r.width,this.height=r.height,t.viewport(0,0,r.width,r.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(r,e,t,i){this.gl.viewport(r,e,t,i)}log(r){this.debug&&console.log("[webgl-plot]:"+r)}}f.ColorRGBA=g,f.WebglAux=x,f.WebglLine=B,f.WebglLinePlot=w,f.WebglLineRoll=F,f.WebglLineThick=C,f.WebglPlot=I,f.WebglScatterAcc=T,Object.defineProperty(f,Symbol.toStringTag,{value:"Module"})});
