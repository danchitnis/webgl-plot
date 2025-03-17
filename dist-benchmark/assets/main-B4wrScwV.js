(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))t(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&t(l)}).observe(document,{childList:!0,subtree:!0});function e(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(o){if(o.ep)return;o.ep=!0;const a=e(o);fetch(o.href,a)}})();var C=Object.defineProperty,L=(s,i,e)=>i in s?C(s,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[i]=e,r=(s,i,e)=>L(s,typeof i!="symbol"?i+"":i,e);class y{constructor(i,e,t,o){r(this,"r"),r(this,"g"),r(this,"b"),r(this,"a"),this.r=i,this.g=e,this.b=t,this.a=o}toArray(){return[this.r,this.g,this.b,this.a]}}class S{constructor(i,e){r(this,"xy",[]),r(this,"color"),i===void 0&&(i=[0,0,1,1]),e===void 0&&(e=new y(1,1,1,1)),this.xy=i,this.color=e}getSize(){return this.xy.length/2}setY(i){for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=i}setYs(i){if(i.length==this.xy.length/2)for(let e=0;e<this.xy.length;e+=2)this.xy[e+1]=i[e/2];else throw new Error("mismatch in array length")}setXYArray(i){this.xy=i}setX(i){for(let e=0;e<this.xy.length;e+=2)this.xy[e]=i}lineSpaceX(i){const e=i;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=2*t/e-1,this.xy[t*2+1]=0}emptyLine(i){const e=i;this.xy=new Array(e*2);for(let t=0;t<e;t++)this.xy[t*2]=0,this.xy[t*2+1]=0}setColor(i){this.color=i}}class b{constructor(i,e){r(this,"gl"),r(this,"prog"),r(this,"width"),r(this,"height"),r(this,"thickness"),r(this,"offset"),r(this,"pointsTexture"),r(this,"vao"),r(this,"vertexBuffer"),r(this,"numPoints",0),r(this,"locations"),this.gl=i.gl,this.width=i.width,this.height=i.height,this.thickness=e,this.offset=[0,0];const t=this.gl,o=`#version 300 es
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
}`,a=`#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;function l(n,h,x){const c=n.createShader(h);if(!c)throw new Error("Could not create shader");if(n.shaderSource(c,x),n.compileShader(c),!n.getShaderParameter(c,n.COMPILE_STATUS))throw new Error("Shader compile error: "+n.getShaderInfoLog(c));return c}function d(n,h,x){const c=l(n,n.VERTEX_SHADER,h),_=l(n,n.FRAGMENT_SHADER,x),f=n.createProgram();if(!f)throw new Error("Could not create program");if(n.attachShader(f,c),n.attachShader(f,_),n.linkProgram(f),!n.getProgramParameter(f,n.LINK_STATUS))throw new Error("Program link error: "+n.getProgramInfoLog(f));return f}this.prog=d(t,o,a),t.useProgram(this.prog),this.pointsTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.bindTexture(t.TEXTURE_2D,null),this.vertexBuffer=t.createBuffer(),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,1,t.FLOAT,!1,8,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,8,4),t.bindVertexArray(null),this.locations={uPointsTex:t.getUniformLocation(this.prog,"uPointsTex"),uNumPoints:t.getUniformLocation(this.prog,"uNumPoints"),uThickness:t.getUniformLocation(this.prog,"uThickness"),uCanvasWidth:t.getUniformLocation(this.prog,"uCanvasWidth"),uCanvasHeight:t.getUniformLocation(this.prog,"uCanvasHeight"),uOffset:t.getUniformLocation(this.prog,"uOffset"),uTexWidth:t.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:t.getUniformLocation(this.prog,"uTexHeight")},t.uniform1i(this.locations.uPointsTex,0),t.uniform1f(this.locations.uCanvasWidth,this.width),t.uniform1f(this.locations.uCanvasHeight,this.height)}updateLine(i){const e=this.gl;this.numPoints=i.length/2,e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.pointsTexture);const t=e.getParameter(e.MAX_TEXTURE_SIZE),o=Math.min(this.numPoints,t),a=Math.ceil(this.numPoints/o),l=o*a,d=new Float32Array(l*2);d.set(i),e.texImage2D(e.TEXTURE_2D,0,e.RG32F,o,a,0,e.RG,e.FLOAT,d),e.useProgram(this.prog),e.uniform1i(this.locations.uNumPoints,this.numPoints),e.uniform1f(this.locations.uThickness,this.thickness),e.uniform1i(this.locations.uTexWidth,o),e.uniform1i(this.locations.uTexHeight,a);const n=new Float32Array(this.numPoints*2*2);for(let h=0;h<this.numPoints;h++)n[h*4+0]=h,n[h*4+1]=1,n[h*4+2]=h,n[h*4+3]=-1;e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW)}draw(){const i=this.gl;i.clear(i.COLOR_BUFFER_BIT),i.useProgram(this.prog),i.bindVertexArray(this.vao),i.drawArrays(i.TRIANGLE_STRIP,0,this.numPoints*2)}setOffset(i,e){this.offset=[i,e];const t=this.gl;t.useProgram(this.prog),t.uniform2fv(this.locations.uOffset,new Float32Array(this.offset))}}class O{constructor(i,e){r(this,"gl"),r(this,"width"),r(this,"height"),r(this,"gScaleX"),r(this,"gScaleY"),r(this,"gXYratio"),r(this,"gOffsetX"),r(this,"gOffsetY"),r(this,"debug",!1),e==null?this.gl=i.getContext("webgl2",{antialias:!0,transparent:!1}):(this.gl=i.getContext("webgl2",{antialias:e.antialias,transparent:e.transparent,desynchronized:e.deSync,powerPerformance:e.powerPerformance,preserveDrawing:e.preserveDrawing}),this.debug=e.debug==null?!1:e.debug),this.log("canvas type is: "+i.constructor.name),this.log(`[webgl-plot]:width=${i.width}, height=${i.height}`);const t=this.gl;this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,this.width=i.width,this.height=i.height,t.viewport(0,0,i.width,i.height),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_DST_ALPHA),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT)}update(){this.clear()}clear(){this.gl.clear(this.gl.COLOR_BUFFER_BIT)}viewport(i,e,t,o){this.gl.viewport(i,e,t,o)}log(i){this.debug&&console.log("[webgl-plot]:"+i)}}const F=document.getElementById("fps"),N=document.getElementById("btClick"),X=document.getElementById("inNum"),u=document.getElementById("my_canvas");if(!u)throw new Error("Canvas element not found");const w=window.devicePixelRatio||1;u.width=u.clientWidth*w;u.height=u.clientHeight*w;const g=1e5;console.log("numX",g);const P=new O(u),A=new S;A.setColor(new y(255,255,0,1));A.lineSpaceX(g);const v=new b(P,10);let p=0,E=new Date;const T=new Float32Array(g*2);for(let s=0;s<1;s++){for(let i=0;i<g;i++){const e=i/g*u.width,t=(Math.sin(i*.005)*.2+.5)*u.height;T[i*2]=e,T[i*2+1]=t}v.updateLine(T)}let m=-1;function R(){P.clear(),m=m+.01,m>1&&(m=-1),v.setOffset(0,m),v.draw();const s=new Date;s.getTime()-E.getTime()>1e3?(console.log(p),F.innerHTML=`Current fps: ${p}`,p=0,E=s):p++,requestAnimationFrame(R)}requestAnimationFrame(R);N.addEventListener("click",()=>{const s=X.value,i=new Date;console.log(`Created ${s} in ${new Date().getTime()-i.getTime()} milliseconds`)});
