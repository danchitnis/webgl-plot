import ndarray = require("ndarray");
import { webGLplot } from "./webGLplot"


let num = 1000;

let vert = ndarray(new Float32Array(num*2), [num, 2]);

let canv = <HTMLCanvasElement>document.getElementById("my_canvas");

let wglp = new webGLplot(canv, vert);

for (let i=0; i<num; i++) {
   //set x to -num/2:1:+num/2
   vert.set(i, 0, 2*i/num-1);
}

let phi = 0;

setInterval(function () {
   for (let i=0; i<num; i++) {
      let y = Math.sin(i*Math.PI/100 + phi) + Math.random()/10;
      vert.set(i,1, 0.9*y);
   }
   phi = phi + 0.01;
   
   wglp.update();
   
}, 16.667*3);





