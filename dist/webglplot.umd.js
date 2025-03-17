(function(f,c){typeof exports=="object"&&typeof module<"u"?c(exports):typeof define=="function"&&define.amd?define(["exports"],c):(f=typeof globalThis<"u"?globalThis:f||self,c(f.webglplot={}))})(this,function(f){"use strict";var B=Object.defineProperty;var L=(f,c,A)=>c in f?B(f,c,{enumerable:!0,configurable:!0,writable:!0,value:A}):f[c]=A;var o=(f,c,A)=>L(f,typeof c!="symbol"?c+"":c,A);class c{constructor(r,e,t,i){o(this,"r");o(this,"g");o(this,"b");o(this,"a");this.r=r,this.g=e,this.b=t,this.a=i}toArray(){return[this.r,this.g,this.b,this.a]}}class A{constructor(r){o(this,"wglp");o(this,"lines");o(this,"gl");o(this,"coord");o(this,"vbuffer");o(this,"prog");this.wglp=r,this.gl=r.gl;const e=this.gl;this.lines=[];const t=`#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`,i=this.gl.createShader(this.gl.VERTEX_SHADER);if(!i)throw new Error("Error creating vertex shader");this.gl.shaderSource(i,t),this.gl.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(i));const n=`#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`,a=this.gl.createShader(this.gl.FRAGMENT_SHADER);if(!a)throw new Error("Error creating fragment shader");this.gl.shaderSource(a,n),this.gl.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)||console.error(e.getShaderInfoLog(a)),this.prog=this.gl.createProgram(),this.gl.attachShader(this.prog,i),this.gl.attachShader(this.prog,a),this.gl.linkProgram(this.prog),this.gl.useProgram(this.prog),this.vbuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.coord=this.gl.getAttribLocation(this.prog,"coord"),this.gl.vertexAttribPointer(this.coord,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(this.coord),e.useProgram(this.prog);const l=e.getUniformLocation(this.prog,"uscale");e.uniformMatrix2fv(l,!1,new Float32Array([this.wglp.gScaleX,0,0,this.wglp.gScaleY]));const s=e.getUniformLocation(this.prog,"uoffset");e.uniform2fv(s,new Float32Array([this.wglp.gOffsetX,this.wglp.gOffsetY]));const h=e.getUniformLocation(this.prog,"uColor");e.uniform4fv(h,[1,1,0,1])}addLine(r){this.lines.push(r)}draw(){this.gl.useProgram(this.prog),this.lines.forEach(r=>{this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(r.xy),this.gl.STREAM_DRAW);const e=this.gl.getUniformLocation(this.prog,"uColor");this.gl.uniform4f(e,r.color.r,r.color.g,r.color.b,r.color.a),this.gl.drawArrays(this.gl.LINE_STRIP,0,r.xy.length/2)})}}class x{constructor(r,e){o(this,"wglp");o(this,"headIndex",0);o(this,"color");o(this,"squareSize");o(this,"maxSquare");o(this,"gl");o(this,"squareIndices",new Uint16Array([0,1,2,2,1,3]));o(this,"colorsBuffer");o(this,"positionBuffer");o(this,"prog");o(this,"attrPosLocation");o(this,"attrColorLocation");this.wglp=r,this.color=new c(1,1,1,1),this.squareSize=.1,this.maxSquare=e,this.gl=r.gl;const t=this.gl,i=t.createShader(t.VERTEX_SHADER);if(!i)throw new Error("Unable to create vertex shader");t.shaderSource(i,`#version 300 es

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

`),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(i));const n=t.createShader(t.FRAGMENT_SHADER);if(!n)throw new Error("Unable to create fragment shader");t.shaderSource(n,`#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(n));const a=t.createProgram();t.attachShader(a,i),t.attachShader(a,n),t.linkProgram(a),t.useProgram(a),this.prog=a;const l=t.createBuffer();t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,l),t.bufferData(t.ELEMENT_ARRAY_BUFFER,this.squareIndices,t.STATIC_DRAW);const s=new Float32Array(Array.from({length:this.maxSquare*2},()=>0));this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferData(t.ARRAY_BUFFER,s,t.DYNAMIC_DRAW),this.attrPosLocation=t.getAttribLocation(this.prog,"position"),t.vertexAttribPointer(this.attrPosLocation,2,t.FLOAT,!1,0,0),t.vertexAttribDivisor(this.attrPosLocation,1),t.enableVertexAttribArray(this.attrPosLocation);const h=new Uint8Array(Array.from({length:this.maxSquare*3},()=>255));this.colorsBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferData(t.ARRAY_BUFFER,h,t.DYNAMIC_DRAW),this.attrColorLocation=t.getAttribLocation(this.prog,"sColor"),t.vertexAttribPointer(this.attrColorLocation,3,t.UNSIGNED_BYTE,!1,0,0),t.vertexAttribDivisor(this.attrColorLocation,1),t.enableVertexAttribArray(this.attrColorLocation),this.setScale(1,1),this.setOffset(0,0)}setColor(r){this.color=r;const e=this.gl.getUniformLocation(this.prog,"u_color");this.gl.uniform4f(e,r.r,r.g,r.b,r.a)}setSquareSize(r){this.squareSize=r;const e=this.gl.getUniformLocation(this.prog,"u_size");this.gl.uniform1f(e,this.squareSize)}setScale(r,e){const t=this.gl.getUniformLocation(this.prog,"u_scale");this.gl.uniformMatrix2fv(t,!1,[r*this.wglp.gScaleX,0,0,e*this.wglp.gScaleY])}setOffset(r,e){const t=this.gl.getUniformLocation(this.prog,"u_offset");this.gl.uniform2f(t,r+this.wglp.gOffsetX,e+this.wglp.gOffsetY)}addSquare(r,e){const t=this.gl;t.useProgram(this.prog),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*2*4,r,0,r.length),t.enableVertexAttribArray(this.attrPosLocation),t.bindBuffer(t.ARRAY_BUFFER,this.colorsBuffer),t.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*3*1,e,0,e.length),t.enableVertexAttribArray(this.attrColorLocation),this.headIndex=(this.headIndex+r.length/2)%this.maxSquare}draw(){this.gl.useProgram(this.prog),this.gl.drawElementsInstanced(this.gl.TRIANGLES,this.squareIndices.length,this.gl.UNSIGNED_SHORT,0,this.maxSquare)}}class R{constructor(r,e){o(this,"xy",[]);o(this,"color");r===void 0&&(r=[0,0,1,1]),e===void 0&&(e=new c(1,1,1,1)),this.xy=r,this.color=e}getSize(){return this.xy.length/2}setY(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r}setYs(r){if(r.length==this.xy.length/2)for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=r[e/2];else throw new Error("mismatch in array length")}setXYArray(r){this.xy=r}setX(r){for(let e=0;e<this.xy.length;e+=2)this.xy[e]=r}lineSpaceX(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=2*t/e-1,this.xy[t*2+1]=0}emptyLine(r){const e=r;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(r){this.color=r}}class E{constructor(r,e,t){o(this,"gl");o(this,"aPositionLocation");o(this,"vertexBuffer");o(this,"program");o(this,"rollBufferSize");o(this,"shift");o(this,"dataIndex");o(this,"dataX");o(this,"lastDataX");o(this,"lastDataY");o(this,"numLines");o(this,"ext");o(this,"colorBuffer");o(this,"aColorLocation");o(this,"uShiftLocation");this.gl=r.gl,this.rollBufferSize=e,this.shift=0,this.dataIndex=0,this.dataX=1,this.lastDataX=Array(t).fill(0),this.lastDataY=Array(t).fill(0),this.numLines=t;const i=this.gl;this.ext=i.getExtension("WEBGL_multi_draw");const n=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color/ vec3(255.0, 255.0, 255.0);
        }`,a=i.createShader(i.VERTEX_SHADER);if(!a)throw new Error("Failed to create vertex shader");i.shaderSource(a,n),i.compileShader(a),i.getShaderParameter(a,i.COMPILE_STATUS)||console.error(i.getShaderInfoLog(a));const l=`#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`,s=i.createShader(i.FRAGMENT_SHADER);if(!s)throw new Error("Failed to create fragment shader");i.shaderSource(s,l),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)||console.error(i.getShaderInfoLog(s)),this.program=i.createProgram(),i.attachShader(this.program,a),i.attachShader(this.program,s),i.linkProgram(this.program),i.getProgramParameter(this.program,i.LINK_STATUS)||console.error(i.getProgramInfoLog(this.program)),this.vertexBuffer=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,new Float32Array((this.rollBufferSize+2)*2*t),i.DYNAMIC_DRAW),this.aPositionLocation=i.getAttribLocation(this.program,"a_position"),i.vertexAttribPointer(this.aPositionLocation,2,i.FLOAT,!1,0,0),i.enableVertexAttribArray(this.aPositionLocation),this.colorBuffer=i.createBuffer();const h=Array((this.rollBufferSize+2)*3*t).fill(128);i.bindBuffer(this.gl.ARRAY_BUFFER,this.colorBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Uint8Array(h),i.STATIC_DRAW),this.aColorLocation=i.getAttribLocation(this.program,"a_color"),i.vertexAttribPointer(this.aColorLocation,3,i.UNSIGNED_BYTE,!1,0,0),i.enableVertexAttribArray(this.aColorLocation),this.uShiftLocation=i.getUniformLocation(this.program,"uShift")}addPoint(r){const e=this.gl,t=this.rollBufferSize+2;this.shift+=2/this.rollBufferSize,this.dataX+=2/this.rollBufferSize,e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);for(let i=0;i<this.numLines;i++)e.bufferSubData(e.ARRAY_BUFFER,(this.dataIndex+t*i)*2*4,new Float32Array([this.dataX,r[i]]));if(e.enableVertexAttribArray(this.aPositionLocation),this.dataIndex===this.rollBufferSize-1)for(let i=0;i<this.numLines;i++)this.lastDataX[i]=this.dataX,this.lastDataY[i]=r[i];if(this.dataIndex===0&&this.lastDataX[0]!==0)for(let i=0;i<this.numLines;i++)e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+t*i)*2*4,new Float32Array([this.lastDataX[i],this.lastDataY[i],this.dataX,r[i]]));this.dataIndex=(this.dataIndex+1)%this.rollBufferSize}addPoints(r){const e=this.gl,t=this.rollBufferSize+2;e.useProgram(this.program),e.uniform1f(this.uShiftLocation,this.shift),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer);let i=this.dataIndex,n=0;for(let a=0;a<r.length;a++){i=this.dataIndex,n=0;for(let l=0;l<r[a].length;l++){const s=this.dataX+l*2/this.rollBufferSize;if(i<this.rollBufferSize&&e.bufferSubData(e.ARRAY_BUFFER,(i+a*t)*2*4,new Float32Array([s,r[a][l]])),i===this.rollBufferSize-1&&(this.lastDataX[a]=s,this.lastDataY[a]=r[a][l]),i%this.rollBufferSize===0&&this.lastDataX[a]!==0&&e.bufferSubData(e.ARRAY_BUFFER,(this.rollBufferSize+a*t)*2*4,new Float32Array([this.lastDataX[a],this.lastDataY[a],s,r[a][l]])),i>=this.rollBufferSize){const h=i%this.rollBufferSize;e.bufferSubData(e.ARRAY_BUFFER,(h+a*t)*2*4,new Float32Array([s,r[a][l]]))}i++,n=s}}this.shift+=r[0].length*2/this.rollBufferSize,this.dataX=n+2/this.rollBufferSize,this.dataIndex=i%this.rollBufferSize,e.enableVertexAttribArray(this.aPositionLocation)}drawOld(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);for(let t=0;t<this.numLines;t++)e.drawArrays(e.LINE_STRIP,t*r,this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.dataIndex,this.rollBufferSize-this.dataIndex),e.drawArrays(e.LINE_STRIP,t*r+this.rollBufferSize,2)}drawExt(){const r=this.rollBufferSize+2,e=this.gl;this.gl.useProgram(this.program);const t=[],i=[];for(let n=0;n<this.numLines;n++)t.push(n*r),i.push(this.dataIndex),t.push(n*r+this.dataIndex),i.push(this.rollBufferSize-this.dataIndex),t.push(n*r+this.rollBufferSize),i.push(2);if(!this.ext)throw new Error("Multi draw extension not available");this.ext.multiDrawArraysWEBGL(e.LINE_STRIP,t,0,i,0,i.length)}draw(){this.ext?this.drawExt():this.drawOld()}setLineColor(r,e){const t=this.gl;t.useProgram(this.program),t.bindBuffer(t.ARRAY_BUFFER,this.colorBuffer);const i=[];for(let n=0;n<this.rollBufferSize+2;n++)i.push(r.r),i.push(r.g),i.push(r.b);t.bufferSubData(t.ARRAY_BUFFER,(this.rollBufferSize+2)*3*e*1,new Uint8Array(i)),t.enableVertexAttribArray(this.aColorLocation)}}class _{constructor(r,e){o(this,"lines");o(this,"gl");o(this,"coord");o(this,"vertexBuffer");o(this,"prog");o(this,"lineSizes");o(this,"totalLineSizes");o(this,"lineSizeAccum");o(this,"updateLine",r=>{const e=this.gl;e.useProgram(this.prog),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferSubData(e.ARRAY_BUFFER,4*2*this.lineSizeAccum[r],new Float32Array(this.lines[r].xy)),e.enableVertexAttribArray(this.coord)});o(this,"draw",()=>{const r=this.gl;r.useProgram(this.prog);for(let e=0;e<this.lineSizes.length;e++)r.drawArrays(r.LINE_STRIP,this.lineSizeAccum[e],this.lineSizes[e])});this.gl=r.gl;const t=this.gl;this.lines=e;const i=e.map(u=>u.xy.length/2);this.lineSizes=i;const n=`#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_Color;
      
        out vec3 vColor;
      
        void main() {
            vColor = a_Color;
            gl_Position = vec4(a_position, 0, 1);
        }`,a=t.createShader(t.VERTEX_SHADER);if(!a)throw new Error("Error creating vertex shader");t.shaderSource(a,n),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(a));const l=`#version 300 es
        precision mediump float;
        in vec3 vColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(vColor,0.8);
        }`,s=t.createShader(t.FRAGMENT_SHADER);if(!s)throw new Error("Error creating fragment shader");t.shaderSource(s,l),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(s)),this.prog=t.createProgram(),t.attachShader(this.prog,a),t.attachShader(this.prog,s),t.linkProgram(this.prog),t.useProgram(this.prog);const h=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,h),this.totalLineSizes=i.reduce((u,p)=>u+p,0),this.lineSizeAccum=i.reduce((u,p)=>(u.push(u[u.length-1]+p),u),[0]).splice(0,i.length);const S=Array.from({length:i.length},()=>[Math.random(),Math.random(),Math.random()]);let g=Array.from({length:i[0]},(u,p)=>p).flatMap(()=>S[0]);for(let u=1;u<i.length;u++)g=g.concat(Array.from({length:i[u]},(p,P)=>P).flatMap(()=>S[u]));t.bufferData(t.ARRAY_BUFFER,new Float32Array(g),t.DYNAMIC_DRAW);const v=t.getAttribLocation(this.prog,"a_Color");t.vertexAttribPointer(v,3,t.FLOAT,!1,0,0),t.enableVertexAttribArray(v),this.vertexBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),this.coord=t.getAttribLocation(this.prog,"a_position"),t.vertexAttribPointer(this.coord,2,t.FLOAT,!1,0,0),t.enableVertexAttribArray(this.coord);const d=new Float32Array(this.totalLineSizes*2);t.bufferData(t.ARRAY_BUFFER,new Float32Array(d),t.DYNAMIC_DRAW),t.clearColor(.1,.1,.1,1),t.clear(t.COLOR_BUFFER_BIT),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.viewport(0,0,r.width,r.height)}}class b{constructor(r,e){o(this,"gl");o(this,"prog");o(this,"width");o(this,"height");o(this,"thickness");o(this,"offset");o(this,"pointsTexture");o(this,"vao");o(this,"vertexBuffer");o(this,"numPoints",0);o(this,"locations");this.gl=r.gl,this.width=r.width,this.height=r.height,this.thickness=e,this.offset=[0,0];const t=this.gl,i=`#version 300 es
precision mediump float;
uniform sampler2D uPointsTex;
uniform int uNumPoints;
uniform float uThickness;
uniform float uCanvasWidth;
uniform float uCanvasHeight;
uniform int uTexWidth;
uniform int uTexHeight;
uniform vec2 uOffset;

in float aIndex;
in float aSide;

// Fetch a polyline point from the 2D texture.
vec2 getPoint(int idx) {
  int texX = idx % uTexWidth;
  int texY = idx / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

void main() {
  int index = int(aIndex);
  // Current point.
  vec2 p = getPoint(index);
  // For endpoints, replicate the current point.
  vec2 pPrev = (index == 0) ? p : getPoint(index - 1);
  vec2 pNext = (index == uNumPoints - 1) ? p : getPoint(index + 1);
  
  vec2 offsetNormal;
  if(index == 0) {
    // For the start point, use the normal of the segment (p -> pNext).
    vec2 dir = normalize(pNext - p);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else if(index == uNumPoints - 1) {
    // For the end point, use the normal of the segment (pPrev -> p).
    vec2 dir = normalize(p - pPrev);
    offsetNormal = vec2(-dir.y, dir.x);
    offsetNormal *= uThickness * 0.5;
  } else {
    // For interior points, compute miter join.
    vec2 dir0 = normalize(p - pPrev);
    vec2 dir1 = normalize(pNext - p);
    vec2 n0 = vec2(-dir0.y, dir0.x);
    vec2 n1 = vec2(-dir1.y, dir1.x);
    vec2 miter = normalize(n0 + n1);
    // Compute raw miter scale.
    float rawMiterScale = uThickness * 0.5 / max(dot(miter, n1), 0.001);
    // Clamp the miter scale to avoid excessively long miters.
    float miterLimit = 4.0; // adjust this value as needed
    float miterScale = min(rawMiterScale, miterLimit);
    offsetNormal = miter * miterScale;
  }
  
  // Compute the offset position for this vertex.
  vec2 pos = p + offsetNormal * aSide;
  
  // Apply a global offset (uOffset is in NDC, so convert to pixel offset).
  vec2 pixelOffset = uOffset * vec2(uCanvasWidth, uCanvasHeight) * 0.5;
  pos += pixelOffset;
  
  // Convert from pixel coordinates to clip space.
  float clipX = (pos.x / uCanvasWidth) * 2.0 - 1.0;
  float clipY = 1.0 - (pos.y / uCanvasHeight) * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}`,n=`#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;function a(s,h,S){const g=s.createShader(h);if(!g)throw new Error("Could not create shader");if(s.shaderSource(g,S),s.compileShader(g),!s.getShaderParameter(g,s.COMPILE_STATUS))throw new Error("Shader compile error: "+s.getShaderInfoLog(g));return g}function l(s,h,S){const g=a(s,s.VERTEX_SHADER,h),v=a(s,s.FRAGMENT_SHADER,S),d=s.createProgram();if(!d)throw new Error("Could not create program");if(s.attachShader(d,g),s.attachShader(d,v),s.linkProgram(d),!s.getProgramParameter(d,s.LINK_STATUS))throw new Error("Program link error: "+s.getProgramInfoLog(d));return d}this.prog=l(t,i,n),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,8,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,8,4),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uNumPoints:t.getUniformLocation(this.prog,"uNumPoints"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uCanvasWidth:t.getUniformLocation(this.prog,"uCanvasWidth"),uCanvasHeight:t.getUniformLocation(this.prog,"uCanvasHeight"),uOffset:t.getUniformLocation(this.prog,"uOffset"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight")},t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uCanvasWidth,this.width),t.uniform1f(this.locations.uCanvasHeight,this.height)}updateLine(r){const e=this.gl;this.numPoints=r.length/2,e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.pointsTexture);const t=e.getParameter(e.MAX_TEXTURE_SIZE),i=Math.min(this.numPoints,t),n=Math.ceil(this.numPoints/i),a=i*n,l=new Float32Array(a*2);l.set(r),e.texImage2D(e.TEXTURE_2D,0,e.RG32F,i,n,0,e.RG,e.FLOAT,l),e.useProgram(this.prog),e.uniform1i(this.locations.uNumPoints,this.numPoints),e.uniform1f(this.locations.uThickness,this.thickness),e.uniform1i(this.locations.uTexWidth,i),e.uniform1i(this.locations.uTexHeight,n);const s=new Float32Array(this.numPoints*2*2);for(let h=0;h<this.numPoints;h++)s[h*4+0]=h,s[h*4+1]=1,s[h*4+2]=h,s[h*4+3]=-1;e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW)}draw(){const r=this.gl;r.clear(r.COLOR_BUFFER_BIT),r.useProgram(this.prog),r.bindVertexArray(this.vao),r.drawArrays(r.TRIANGLE_STRIP,0,this.numPoints*2)}setOffset(r,e){this.offset=[r,e];const t=this.gl;t.useProgram(this.prog),t.uniform2fv(this.locations.uOffset,new Float32Array(this.offset))}}class T{constructor(r,e){o(this,"gl");o(this,"width");o(this,"height");o(this,"gScaleX");o(this,"gScaleY");o(this,"gXYratio");o(this,"gOffsetX");o(this,"gOffsetY");o(this,"debug",!1);e==null?this.gl=r.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=r.getContext("webgl2",{antialias:e.antialias,transparent:e.transparent,desynchronized:e.deSync,powerPerformance:e.powerPerformance,preserveDrawing:e.preserveDrawing}),this.debug=e.debug==null?!1:e.debug),this.log("canvas type is: "+r.constructor.name),this.log(`[webgl-plot]:width=${r.width}, height=${r.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=r.width,this.height=r.height,t.viewport(0,0,r.width,r.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(r,e,t,i){this.gl.viewport(r,e,t,i)}log(r){this.debug&&console.log("[webgl-plot]:"+r)}}f.ColorRGBA=c,f.WebglAux=A,f.WebglLine=R,f.WebglLinePlot=_,f.WebglLineRoll=E,f.WebglLineThick=b,f.WebglPlot=T,f.WebglScatterAcc=x,Object.defineProperty(f,Symbol.toStringTag,{value:"Module"})});
