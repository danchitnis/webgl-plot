(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const u of l.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&t(u)}).observe(document,{childList:!0,subtree:!0});function i(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function t(n){if(n.ep)return;n.ep=!0;const l=i(n);fetch(n.href,l)}})();var U=Object.defineProperty,D=(a,e,i)=>e in a?U(a,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):a[e]=i,r=(a,e,i)=>D(a,typeof e!="symbol"?e+"":e,i);class C{constructor(e,i,t,n){r(this,"r"),r(this,"g"),r(this,"b"),r(this,"a"),this.r=e,this.g=i,this.b=t,this.a=n}toArray(){return[this.r,this.g,this.b,this.a]}}class B{constructor(e,i){r(this,"xy",[]),r(this,"color"),e===void 0&&(e=[0,0,1,1]),i===void 0&&(i=new C(1,1,1,1)),this.xy=e,this.color=i}getSize(){return this.xy.length/2}setY(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e}setYs(e){if(e.length==this.xy.length/2)for(let i=0;i<this.xy.length;i+=2)this.xy[i+1]=e[i/2];else throw new Error("mismatch in array length")}setXYArray(e){this.xy=e}setX(e){for(let i=0;i<this.xy.length;i+=2)this.xy[i]=e}lineSpaceX(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=2*t/i-1,this.xy[t*2+1]=0}emptyLine(e){const i=e;this.xy=new Array(i*2);for(let t=0;t<i;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(e){this.color=e}}const P=10;class M{constructor(e,i){r(this,"gl"),r(this,"prog"),r(this,"width"),r(this,"height"),r(this,"thickness"),r(this,"pointsTexture"),r(this,"vao"),r(this,"vertexBuffer"),r(this,"locations"),r(this,"lineDrawCalls",[]),r(this,"totalVertexCount",0),r(this,"numLines",0),r(this,"currentLineScale",new Float32Array(0)),r(this,"currentLineOffset",new Float32Array(0)),this.gl=e.gl,this.width=e.width,this.height=e.height,this.thickness=i;const t=this.gl,n=`#version 300 es
precision mediump float;
#define MAX_LINES ${P}

uniform sampler2D uPointsTex;
uniform float uThickness;
uniform float uCanvasWidth;
uniform float uCanvasHeight;
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

  // Fetch the current point and its neighbors.
  vec2 p = getPoint(globalIndex);
  vec2 pPrev = (localIndex == 0) ? p : getPoint(uLineStart[lineId] + localIndex - 1);
  vec2 pNext = (localIndex == numPoints - 1) ? p : getPoint(uLineStart[lineId] + localIndex + 1);
  
  // Apply per-line transformation with independent x and y scale.
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
  
  // Convert from pixel coordinates to clip space.
  float clipX = (pos.x / uCanvasWidth) * 2.0 - 1.0;
  float clipY = 1.0 - (pos.y / uCanvasHeight) * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}
`,l=`#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;function u(s,m,L){const h=s.createShader(m);if(!h)throw new Error("Could not create shader");if(s.shaderSource(h,L),s.compileShader(h),!s.getShaderParameter(h,s.COMPILE_STATUS))throw new Error("Shader compile error: "+s.getShaderInfoLog(h));return h}function d(s,m,L){const h=u(s,s.VERTEX_SHADER,m),T=u(s,s.FRAGMENT_SHADER,L),f=s.createProgram();if(!f)throw new Error("Could not create program");if(s.attachShader(f,h),s.attachShader(f,T),s.linkProgram(f),!s.getProgramParameter(f,s.LINK_STATUS))throw new Error("Program link error: "+s.getProgramInfoLog(f));return f}this.prog=d(t,n,l),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,12,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,12,4),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,12,8),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uCanvasWidth:t.getUniformLocation(this.prog,"uCanvasWidth"),uCanvasHeight:t.getUniformLocation(this.prog,"uCanvasHeight"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight"),uNumLines:t.getUniformLocation(this.prog,"uNumLines"),uLineStart:t.getUniformLocation(this.prog,"uLineStart[0]"),uLineNumPoints:t.getUniformLocation(this.prog,"uLineNumPoints[0]"),uLineScale:t.getUniformLocation(this.prog,"uLineScale[0]"),uLineOffset:t.getUniformLocation(this.prog,"uLineOffset[0]")},t.useProgram(this.prog),t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uCanvasWidth,this.width),t.uniform1f(this.locations.uCanvasHeight,this.height),t.uniform1f(this.locations.uThickness,this.thickness)}updateLines(e){const i=this.gl;if(e.length>P)throw new Error(`This shader supports up to ${P} lines.`);this.numLines=e.length;let t=0;const n=new Int32Array(e.length),l=new Int32Array(e.length),u=new Float32Array(e.length*2),d=new Float32Array(e.length*2);for(let o=0;o<e.length;o++){n[o]=t;const x=e[o].points.length/2;l[o]=x,t+=x,u[o*2+0]=e[o].scale[0],u[o*2+1]=e[o].scale[1],d[o*2+0]=e[o].offset[0],d[o*2+1]=e[o].offset[1]}this.currentLineScale=u,this.currentLineOffset=d;const s=new Float32Array(t*2);let m=0;for(let o=0;o<e.length;o++)s.set(e[o].points,m),m+=e[o].points.length;i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.pointsTexture);const L=i.getParameter(i.MAX_TEXTURE_SIZE),h=Math.min(t,L),T=Math.ceil(t/h),f=h*T,R=new Float32Array(f*2);R.set(s),i.texImage2D(i.TEXTURE_2D,0,i.RG32F,h,T,0,i.RG,i.FLOAT,R);const g=new Float32Array(t*2*3);let p=0;this.lineDrawCalls=[];let S=0;for(let o=0;o<e.length;o++){const x=l[o];this.lineDrawCalls.push({offset:S,count:x*2});for(let y=0;y<x;y++)g[p++]=o,g[p++]=y,g[p++]=1,g[p++]=o,g[p++]=y,g[p++]=-1;S+=x*2}this.totalVertexCount=S,i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,g,i.STATIC_DRAW),i.useProgram(this.prog),i.uniform1i(this.locations.uTexWidth,h),i.uniform1i(this.locations.uTexHeight,T),i.uniform1i(this.locations.uNumLines,e.length),i.uniform1iv(this.locations.uLineStart,n),i.uniform1iv(this.locations.uLineNumPoints,l),i.uniform2fv(this.locations.uLineScale,u),i.uniform2fv(this.locations.uLineOffset,d)}updateLineTransform(e,i,t){if(e<0||e>=this.numLines)throw new Error(`Invalid lineId: ${e}`);this.currentLineScale[e*2+0]=i[0],this.currentLineScale[e*2+1]=i[1],this.currentLineOffset[e*2]=t[0],this.currentLineOffset[e*2+1]=t[1];const n=this.gl;n.useProgram(this.prog),n.uniform2fv(this.locations.uLineScale,this.currentLineScale),n.uniform2fv(this.locations.uLineOffset,this.currentLineOffset)}draw(){const e=this.gl;e.clear(e.COLOR_BUFFER_BIT),e.useProgram(this.prog),e.bindVertexArray(this.vao);for(let i=0;i<this.lineDrawCalls.length;i++){const{offset:t,count:n}=this.lineDrawCalls[i];e.drawArrays(e.TRIANGLE_STRIP,t,n)}}}class H{constructor(e,i){r(this,"gl"),r(this,"width"),r(this,"height"),r(this,"gScaleX"),r(this,"gScaleY"),r(this,"gXYratio"),r(this,"gOffsetX"),r(this,"gOffsetY"),r(this,"debug",!1),i==null?this.gl=e.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=e.getContext("webgl2",{antialias:i.antialias,transparent:i.transparent,desynchronized:i.deSync,powerPerformance:i.powerPerformance,preserveDrawing:i.preserveDrawing}),this.debug=i.debug==null?!1:i.debug),this.log("canvas type is: "+e.constructor.name),this.log(`[webgl-plot]:width=${e.width}, height=${e.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=e.width,this.height=e.height,t.viewport(0,0,e.width,e.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(e,i,t,n){this.gl.viewport(e,i,t,n)}log(e){this.debug&&console.log("[webgl-plot]:"+e)}}const W=document.getElementById("fps"),Y=document.getElementById("btClick"),k=document.getElementById("inNum"),c=document.getElementById("my_canvas");if(!c)throw new Error("Canvas element not found");const N=window.devicePixelRatio||1;c.width=c.clientWidth*N;c.height=c.clientHeight*N;const w=1e4;console.log("numX",w);const O=new H(c),X=new B;X.setColor(new C(255,255,0,1));X.lineSpaceX(w);const _=new M(O,10);let E=0,b=new Date;const I=new Float32Array(w*2),F=[],A=5;for(let a=0;a<A;a++){for(let e=0;e<w;e++){const i=e/w*c.width,t=(Math.sin(e*.005)*.2+.5)*c.height;I[e*2]=i,I[e*2+1]=t}F.push({points:new Float32Array(I),scale:[1,1],offset:[0,-c.height/2+a/(A-1)*c.height]})}_.updateLines(F);let v=0;function V(){O.clear(),v=v+.003,v>1&&(v=-1);for(let e=0;e<A;e++){const i=-c.height/2+e/(A-1)*c.height;_.updateLineTransform(e,[1,1],[0,i+v*c.height])}_.draw();const a=new Date;a.getTime()-b.getTime()>1e3?(console.log(E),W.innerHTML=`Current fps: ${E}`,E=0,b=a):E++}requestAnimationFrame(V);Y.addEventListener("click",()=>{const a=k.value,e=new Date;console.log(`Created ${a} in ${new Date().getTime()-e.getTime()} milliseconds`)});
