(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const l of r)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&t(c)}).observe(document,{childList:!0,subtree:!0});function i(r){const l={};return r.integrity&&(l.integrity=r.integrity),r.referrerPolicy&&(l.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?l.credentials="include":r.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function t(r){if(r.ep)return;r.ep=!0;const l=i(r);fetch(r.href,l)}})();var M=Object.defineProperty,B=(a,e,i)=>e in a?M(a,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):a[e]=i,o=(a,e,i)=>B(a,typeof e!="symbol"?e+"":e,i);class C{constructor(e,i,t,r){o(this,"r"),o(this,"g"),o(this,"b"),o(this,"a"),this.r=e,this.g=i,this.b=t,this.a=r}toArray(){return[this.r,this.g,this.b,this.a]}}class Y{constructor(e,i){o(this,"xy",[]),o(this,"color"),e===void 0&&(e=[0,0,1,1]),i===void 0&&(i=new C(1,1,1,1)),this.xy=e,this.color=i}getSize(){return this.xy.length/2}setY(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e}setYs(e){if(e.length==this.xy.length/2)for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e[i/2];else throw new Error("mismatch in array length")}setXYArray(e){this.xy=e}setX(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i]=e}lineSpaceX(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=2*t/i-1,this.xy[t*2+1]=0}emptyLine(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(e){this.color=e}}const A=10;class H{constructor(e,i){o(this,"gl"),o(this,"prog"),o(this,"thickness"),o(this,"pointsTexture"),o(this,"vao"),o(this,"vertexBuffer"),o(this,"locations"),o(this,"lineDrawCalls",[]),o(this,"totalVertexCount",0),o(this,"numLines",0),o(this,"currentLineScale",new Float32Array(0)),o(this,"currentLineOffset",new Float32Array(0)),o(this,"currentLineColor",new Float32Array(0)),this.gl=e.gl,this.thickness=i;const t=this.gl,r=`#version 300 es
precision mediump float;
#define MAX_LINES ${A}

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
`;function c(s,d,g){const u=s.createShader(d);if(!u)throw new Error("Could not create shader");if(s.shaderSource(u,g),s.compileShader(u),!s.getShaderParameter(u,s.COMPILE_STATUS))throw new Error("Shader compile error: "+s.getShaderInfoLog(u));return u}function m(s,d,g){const u=c(s,s.VERTEX_SHADER,d),L=c(s,s.FRAGMENT_SHADER,g),h=s.createProgram();if(!h)throw new Error("Could not create program");if(s.attachShader(h,u),s.attachShader(h,L),s.linkProgram(h),!s.getProgramParameter(h,s.LINK_STATUS))throw new Error("Program link error: "+s.getProgramInfoLog(h));return h}this.prog=m(t,r,l),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,12,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,12,4),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,12,8),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight"),uNumLines:t.getUniformLocation(this.prog,"uNumLines"),uLineStart:t.getUniformLocation(this.prog,"uLineStart[0]"),uLineNumPoints:t.getUniformLocation(this.prog,"uLineNumPoints[0]"),uLineScale:t.getUniformLocation(this.prog,"uLineScale[0]"),uLineOffset:t.getUniformLocation(this.prog,"uLineOffset[0]"),uLineColor:t.getUniformLocation(this.prog,"uLineColor[0]")},t.useProgram(this.prog),t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uThickness,this.thickness),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}updateLines(e){const i=this.gl;if(e.length>A)throw new Error(`This shader supports up to ${A} lines.`);this.numLines=e.length;let t=0;const r=new Int32Array(e.length),l=new Int32Array(e.length),c=new Float32Array(e.length*2),m=new Float32Array(e.length*2),s=new Float32Array(e.length*4);for(let n=0;n<e.length;n++){r[n]=t;const x=e[n].points.length/2;l[n]=x,t+=x,c[n*2+0]=e[n].scale[0],c[n*2+1]=e[n].scale[1],m[n*2+0]=e[n].offset[0],m[n*2+1]=e[n].offset[1],s[n*4+0]=e[n].color[0],s[n*4+1]=e[n].color[1],s[n*4+2]=e[n].color[2],s[n*4+3]=e[n].color[3]}this.currentLineScale=c,this.currentLineOffset=m,this.currentLineColor=s;const d=new Float32Array(t*2);let g=0;for(let n=0;n<e.length;n++)d.set(e[n].points,g),g+=e[n].points.length;i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.pointsTexture);const u=i.getParameter(i.MAX_TEXTURE_SIZE),L=Math.min(t,u),h=Math.ceil(t/L),D=L*h,_=new Float32Array(D*2);_.set(d),i.texImage2D(i.TEXTURE_2D,0,i.RG32F,L,h,0,i.RG,i.FLOAT,_);const f=new Float32Array(t*2*3);let p=0;this.lineDrawCalls=[];let R=0;for(let n=0;n<e.length;n++){const x=l[n];this.lineDrawCalls.push({offset:R,count:x*2});for(let E=0;E<x;E++)f[p++]=n,f[p++]=E,f[p++]=1,f[p++]=n,f[p++]=E,f[p++]=-1;R+=x*2}i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,f,i.STATIC_DRAW),i.useProgram(this.prog),i.uniform1i(this.locations.uTexWidth,L),i.uniform1i(this.locations.uTexHeight,h),i.uniform1i(this.locations.uNumLines,e.length),i.uniform1iv(this.locations.uLineStart,r),i.uniform1iv(this.locations.uLineNumPoints,l),i.uniform2fv(this.locations.uLineScale,c),i.uniform2fv(this.locations.uLineOffset,m),i.uniform4fv(this.locations.uLineColor,s)}updateLineTransform(e,i,t){if(e<0||e>=this.numLines)throw new Error(`Invalid lineId: ${e}`);this.currentLineScale[e*2+0]=i[0],this.currentLineScale[e*2+1]=i[1],this.currentLineOffset[e*2+0]=t[0],this.currentLineOffset[e*2+1]=t[1];const r=this.gl;r.useProgram(this.prog),r.uniform2fv(this.locations.uLineScale,this.currentLineScale),r.uniform2fv(this.locations.uLineOffset,this.currentLineOffset)}updateLineColor(e,i){if(e<0||e>=this.numLines)throw new Error(`Invalid lineId: ${e}`);this.currentLineColor[e*4+0]=i[0],this.currentLineColor[e*4+1]=i[1],this.currentLineColor[e*4+2]=i[2],this.currentLineColor[e*4+3]=i[3];const t=this.gl;t.useProgram(this.prog),t.uniform4fv(this.locations.uLineColor,this.currentLineColor)}draw(){const e=this.gl;e.clear(e.COLOR_BUFFER_BIT),e.useProgram(this.prog),e.bindVertexArray(this.vao);for(let i=0;i<this.lineDrawCalls.length;i++){const{offset:t,count:r}=this.lineDrawCalls[i];e.drawArrays(e.TRIANGLE_STRIP,t,r)}}}class W{constructor(e,i){o(this,"gl"),o(this,"width"),o(this,"height"),o(this,"gScaleX"),o(this,"gScaleY"),o(this,"gXYratio"),o(this,"gOffsetX"),o(this,"gOffsetY"),o(this,"debug",!1),i==null?this.gl=e.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=e.getContext("webgl2",{antialias:i.antialias,transparent:i.transparent,desynchronized:i.deSync,powerPerformance:i.powerPerformance,preserveDrawing:i.preserveDrawing}),this.debug=i.debug==null?!1:i.debug),this.log("canvas type is: "+e.constructor.name),this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=e.width,this.height=e.height,t.viewport(0,0,e.width,e.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(e,i,t,r){this.gl.viewport(e,i,t,r)}log(e){this.debug&&console.log("[webgl-plot]:"+e)}}const k=document.getElementById("fps"),V=document.getElementById("btClick"),$=document.getElementById("inNum"),T=document.getElementById("my_canvas");if(!T)throw new Error("Canvas element not found");const N=window.devicePixelRatio||1;T.width=T.clientWidth*N;T.height=T.clientHeight*N;const w=1e3;console.log("numX",w);const O=new W(T),F=new Y;F.setColor(new C(255,255,0,1));F.lineSpaceX(w);const P=new H(O,.01);let y=0,b=new Date;const S=new Float32Array(w*2),U=[],I=5;for(let a=0;a<I;a++){for(let e=0;e<w;e++){const i=-1+2*e/w,t=Math.sin(e*.05)*.3+0;S[e*2]=i,S[e*2+1]=t}U.push({points:new Float32Array(S),scale:[1,1],offset:[0,0],color:[Math.random(),Math.random(),Math.random(),1]})}P.updateLines(U);let v=0;function X(){O.clear(),v=v+.003,v>1&&(v=-1);for(let e=0;e<I;e++){const i=-1+2*e/(I-1);P.updateLineTransform(e,[1,1],[0,i+v])}P.draw();const a=new Date;a.getTime()-b.getTime()>1e3?(console.log(y),k.innerHTML=`Current fps: ${y}`,y=0,b=a):y++,requestAnimationFrame(X)}requestAnimationFrame(X);V.addEventListener("click",()=>{const a=$.value,e=new Date;console.log(`Created ${a} in ${new Date().getTime()-e.getTime()} milliseconds`)});
