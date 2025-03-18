(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const h of l.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&t(h)}).observe(document,{childList:!0,subtree:!0});function i(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function t(n){if(n.ep)return;n.ep=!0;const l=i(n);fetch(n.href,l)}})();var C=Object.defineProperty,B=(a,e,i)=>e in a?C(a,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):a[e]=i,r=(a,e,i)=>B(a,typeof e!="symbol"?e+"":e,i);class N{constructor(e,i,t,n){r(this,"r"),r(this,"g"),r(this,"b"),r(this,"a"),this.r=e,this.g=i,this.b=t,this.a=n}toArray(){return[this.r,this.g,this.b,this.a]}}class M{constructor(e,i){r(this,"xy",[]),r(this,"color"),e===void 0&&(e=[0,0,1,1]),i===void 0&&(i=new N(1,1,1,1)),this.xy=e,this.color=i}getSize(){return this.xy.length/2}setY(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e}setYs(e){if(e.length==this.xy.length/2)for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e[i/2];else throw new Error("mismatch in array length")}setXYArray(e){this.xy=e}setX(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i]=e}lineSpaceX(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=2*t/i-1,this.xy[t*2+1]=0}emptyLine(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(e){this.color=e}}const A=10;class Y{constructor(e,i){r(this,"gl"),r(this,"prog"),r(this,"thickness"),r(this,"pointsTexture"),r(this,"vao"),r(this,"vertexBuffer"),r(this,"locations"),r(this,"lineDrawCalls",[]),r(this,"totalVertexCount",0),r(this,"numLines",0),r(this,"currentLineScale",new Float32Array(0)),r(this,"currentLineOffset",new Float32Array(0)),this.gl=e.gl,this.thickness=i;const t=this.gl,n=`#version 300 es
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

in float aLineId;  // which line (index)
in float aIndex;   // index within that line
in float aSide;    // +1.0 or -1.0

// Fetch a point from the texture.
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
  
  // Apply the per-line transformation (both scale and offset are in ND).
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
  
  // In ND coordinates, the position is already in the range [-1, 1].
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,l=`#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;function h(s,m,L){const c=s.createShader(m);if(!c)throw new Error("Could not create shader");if(s.shaderSource(c,L),s.compileShader(c),!s.getShaderParameter(c,s.COMPILE_STATUS))throw new Error("Shader compile error: "+s.getShaderInfoLog(c));return c}function g(s,m,L){const c=h(s,s.VERTEX_SHADER,m),T=h(s,s.FRAGMENT_SHADER,L),u=s.createProgram();if(!u)throw new Error("Could not create program");if(s.attachShader(u,c),s.attachShader(u,T),s.linkProgram(u),!s.getProgramParameter(u,s.LINK_STATUS))throw new Error("Program link error: "+s.getProgramInfoLog(u));return u}this.prog=g(t,n,l),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,12,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,12,4),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,12,8),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight"),uNumLines:t.getUniformLocation(this.prog,"uNumLines"),uLineStart:t.getUniformLocation(this.prog,"uLineStart[0]"),uLineNumPoints:t.getUniformLocation(this.prog,"uLineNumPoints[0]"),uLineScale:t.getUniformLocation(this.prog,"uLineScale[0]"),uLineOffset:t.getUniformLocation(this.prog,"uLineOffset[0]")},t.useProgram(this.prog),t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uThickness,this.thickness)}updateLines(e){const i=this.gl;if(e.length>A)throw new Error(`This shader supports up to ${A} lines.`);this.numLines=e.length;let t=0;const n=new Int32Array(e.length),l=new Int32Array(e.length),h=new Float32Array(e.length*2),g=new Float32Array(e.length*2);for(let o=0;o<e.length;o++){n[o]=t;const p=e[o].points.length/2;l[o]=p,t+=p,h[o*2+0]=e[o].scale[0],h[o*2+1]=e[o].scale[1],g[o*2+0]=e[o].offset[0],g[o*2+1]=e[o].offset[1]}this.currentLineScale=h,this.currentLineOffset=g;const s=new Float32Array(t*2);let m=0;for(let o=0;o<e.length;o++)s.set(e[o].points,m),m+=e[o].points.length;i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.pointsTexture);const L=i.getParameter(i.MAX_TEXTURE_SIZE),c=Math.min(t,L),T=Math.ceil(t/c),u=c*T,R=new Float32Array(u*2);R.set(s),i.texImage2D(i.TEXTURE_2D,0,i.RG32F,c,T,0,i.RG,i.FLOAT,R);const f=new Float32Array(t*2*3);let d=0;this.lineDrawCalls=[];let _=0;for(let o=0;o<e.length;o++){const p=l[o];this.lineDrawCalls.push({offset:_,count:p*2});for(let w=0;w<p;w++)f[d++]=o,f[d++]=w,f[d++]=1,f[d++]=o,f[d++]=w,f[d++]=-1;_+=p*2}i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,f,i.STATIC_DRAW),i.useProgram(this.prog),i.uniform1i(this.locations.uTexWidth,c),i.uniform1i(this.locations.uTexHeight,T),i.uniform1i(this.locations.uNumLines,e.length),i.uniform1iv(this.locations.uLineStart,n),i.uniform1iv(this.locations.uLineNumPoints,l),i.uniform2fv(this.locations.uLineScale,h),i.uniform2fv(this.locations.uLineOffset,g)}updateLineTransform(e,i,t){if(e<0||e>=this.numLines)throw new Error(`Invalid lineId: ${e}`);this.currentLineScale[e*2+0]=i[0],this.currentLineScale[e*2+1]=i[1],this.currentLineOffset[e*2]=t[0],this.currentLineOffset[e*2+1]=t[1];const n=this.gl;n.useProgram(this.prog),n.uniform2fv(this.locations.uLineScale,this.currentLineScale),n.uniform2fv(this.locations.uLineOffset,this.currentLineOffset)}draw(){const e=this.gl;e.clear(e.COLOR_BUFFER_BIT),e.useProgram(this.prog),e.bindVertexArray(this.vao);for(let i=0;i<this.lineDrawCalls.length;i++){const{offset:t,count:n}=this.lineDrawCalls[i];e.drawArrays(e.TRIANGLE_STRIP,t,n)}}}class H{constructor(e,i){r(this,"gl"),r(this,"width"),r(this,"height"),r(this,"gScaleX"),r(this,"gScaleY"),r(this,"gXYratio"),r(this,"gOffsetX"),r(this,"gOffsetY"),r(this,"debug",!1),i==null?this.gl=e.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=e.getContext("webgl2",{antialias:i.antialias,transparent:i.transparent,desynchronized:i.deSync,powerPerformance:i.powerPerformance,preserveDrawing:i.preserveDrawing}),this.debug=i.debug==null?!1:i.debug),this.log("canvas type is: "+e.constructor.name),this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=e.width,this.height=e.height,t.viewport(0,0,e.width,e.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(e,i,t,n){this.gl.viewport(e,i,t,n)}log(e){this.debug&&console.log("[webgl-plot]:"+e)}}const W=document.getElementById("fps"),k=document.getElementById("btClick"),V=document.getElementById("inNum"),x=document.getElementById("my_canvas");if(!x)throw new Error("Canvas element not found");const O=window.devicePixelRatio||1;x.width=x.clientWidth*O;x.height=x.clientHeight*O;const E=1e3;console.log("numX",E);const F=new H(x),X=new M;X.setColor(new N(255,255,0,1));X.lineSpaceX(E);const P=new Y(F,.01);let y=0,b=new Date;const S=new Float32Array(E*2),U=[],I=5;for(let a=0;a<I;a++){for(let e=0;e<E;e++){const i=-1+2*e/E,t=Math.sin(e*.05)*.3+0;S[e*2]=i,S[e*2+1]=t}U.push({points:new Float32Array(S),scale:[1,1],offset:[0,0]})}P.updateLines(U);let v=0;function D(){F.clear(),v=v+.003,v>1&&(v=-1);for(let e=0;e<I;e++){const i=-1+2*e/(I-1);P.updateLineTransform(e,[1,1],[0,i+v])}P.draw();const a=new Date;a.getTime()-b.getTime()>1e3?(console.log(y),W.innerHTML=`Current fps: ${y}`,y=0,b=a):y++,requestAnimationFrame(D)}requestAnimationFrame(D);k.addEventListener("click",()=>{const a=V.value,e=new Date;console.log(`Created ${a} in ${new Date().getTime()-e.getTime()} milliseconds`)});
