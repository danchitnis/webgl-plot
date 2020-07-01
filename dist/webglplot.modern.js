class t{constructor(t,s,e,i){this.r=t,this.g=s,this.b=e,this.a=i}}class s{constructor(){this.scaleX=1,this.scaleY=1,this.offsetX=0,this.offsetY=0,this.loop=!1,this._vbuffer=0,this._prog=0,this._coord=0,this.visible=!0,this.intensity=1}}class e extends s{constructor(t,s){super(),this.webglNumPoints=s,this.numPoints=s,this.color=t,this.xy=new Float32Array(2*this.webglNumPoints)}setX(t,s){this.xy[2*t]=s}setY(t,s){this.xy[2*t+1]=s}getX(t){return this.xy[2*t]}getY(t){return this.xy[2*t+1]}lineSpaceX(t,s){for(let e=0;e<this.numPoints;e++)this.setX(e,t+s*e)}constY(t){for(let s=0;s<this.numPoints;s++)this.setY(s,t)}shiftAdd(t){const s=t.length;for(let t=0;t<this.numPoints-s;t++)this.setY(t,this.getY(t+s));for(let e=0;e<s;e++)this.setY(e+this.numPoints-s,t[e])}}class i extends s{constructor(t,s){super(),this.webglNumPoints=2*s,this.numPoints=s,this.color=t,this.xy=new Float32Array(2*this.webglNumPoints)}setY(t,s){this.xy[4*t+1]=s,this.xy[4*t+3]=s}getX(t){return this.xy[4*t]}getY(t){return this.xy[4*t+1]}lineSpaceX(t,s){for(let e=0;e<this.numPoints;e++)this.xy[4*e]=t+e*s,this.xy[4*e+2]=t+(e*s+s)}constY(t){for(let s=0;s<this.numPoints;s++)this.setY(s,t)}shiftAdd(t){const s=t.length;for(let t=0;t<this.numPoints-s;t++)this.setY(t,this.getY(t+s));for(let e=0;e<s;e++)this.setY(e+this.numPoints-s,t[e])}}class o extends s{constructor(t,s){super(),this.webglNumPoints=s,this.numPoints=s,this.color=t,this.intenisty=1,this.xy=new Float32Array(2*this.webglNumPoints),this._vbuffer=0,this._prog=0,this._coord=0,this.visible=!0,this.offsetTheta=0}setRtheta(t,s,e){const i=e*Math.cos(2*Math.PI*(s+this.offsetTheta)/360),o=e*Math.sin(2*Math.PI*(s+this.offsetTheta)/360);this.setX(t,i),this.setY(t,o)}getTheta(t){return 0}getR(t){return Math.sqrt(Math.pow(this.getX(t),2)+Math.pow(this.getY(t),2))}setX(t,s){this.xy[2*t]=s}setY(t,s){this.xy[2*t+1]=s}getX(t){return this.xy[2*t]}getY(t){return this.xy[2*t+1]}}export default class{constructor(t){const s=window.devicePixelRatio||1;t.width=t.clientWidth*s,t.height=t.clientHeight*s;const e=t.getContext("webgl",{antialias:!0,transparent:!1});this.lines=[],this.webgl=e,this.gScaleX=1,this.gScaleY=1,this.gXYratio=1,this.gOffsetX=0,this.gOffsetY=0,e.enable(e.DEPTH_TEST),e.clear(e.COLOR_BUFFER_BIT||e.DEPTH_BUFFER_BIT),e.viewport(0,0,t.width,t.height)}update(){const t=this.webgl;this.lines.forEach(s=>{if(s.visible){t.useProgram(s._prog);const e=t.getUniformLocation(s._prog,"uscale");t.uniformMatrix2fv(e,!1,new Float32Array([s.scaleX*this.gScaleX,0,0,s.scaleY*this.gScaleY*this.gXYratio]));const i=t.getUniformLocation(s._prog,"uoffset");t.uniform2fv(i,new Float32Array([s.offsetX+this.gOffsetX,s.offsetY+this.gOffsetY]));const o=t.getUniformLocation(s._prog,"uColor");t.uniform4fv(o,[s.color.r,s.color.g,s.color.b,s.color.a]),t.bufferData(t.ARRAY_BUFFER,s.xy,t.STREAM_DRAW),t.drawArrays(s.loop?t.LINE_LOOP:t.LINE_STRIP,0,s.webglNumPoints)}})}clear(){this.webgl.clear(this.webgl.COLOR_BUFFER_BIT||this.webgl.DEPTH_BUFFER_BIT)}addLine(t){t._vbuffer=this.webgl.createBuffer(),this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER,t._vbuffer),this.webgl.bufferData(this.webgl.ARRAY_BUFFER,t.xy,this.webgl.STREAM_DRAW);const s=this.webgl.createShader(this.webgl.VERTEX_SHADER);this.webgl.shaderSource(s,"\n      attribute vec2 coordinates;\n      uniform mat2 uscale;\n      uniform vec2 uoffset;\n\n      void main(void) {\n         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);\n      }"),this.webgl.compileShader(s);const e=this.webgl.createShader(this.webgl.FRAGMENT_SHADER);this.webgl.shaderSource(e,"\n         precision mediump float;\n         uniform highp vec4 uColor;\n         void main(void) {\n            gl_FragColor =  uColor;\n         }"),this.webgl.compileShader(e),t._prog=this.webgl.createProgram(),this.webgl.attachShader(t._prog,s),this.webgl.attachShader(t._prog,e),this.webgl.linkProgram(t._prog),this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER,t._vbuffer),t._coord=this.webgl.getAttribLocation(t._prog,"coordinates"),this.webgl.vertexAttribPointer(t._coord,2,this.webgl.FLOAT,!1,0,0),this.webgl.enableVertexAttribArray(t._coord),this.lines.push(t)}removeLine(t){}viewport(t,s,e,i){this.webgl.viewport(t,s,e,i)}}export{t as ColorRGBA,e as WebglLine,o as WebglPolar,i as WebglStep};
//# sourceMappingURL=webglplot.modern.js.map
