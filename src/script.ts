/**
 * Author Danial Chitnis 2019
 */

import ndarray = require("ndarray");
import { webGLplot } from "./webGLplot"
import * as noUiSlider from 'nouislider';



let num = 1000;

let vert = ndarray(new Float32Array(num*2), [num, 2]);

let canv = <HTMLCanvasElement>document.getElementById("my_canvas");

let wglp = new webGLplot(canv, vert);

//amplitude
let amp = 1; 

for (let i=0; i<num; i++) {
   //set x to -num/2:1:+num/2
   vert.set(i, 0, 2*i/num-1);
}

let phi = 0;




//sliders
let slider1 = document.getElementById('slider1') as noUiSlider.Instance;;

noUiSlider.create(slider1, {
   start: [0.5],
   connect: [true, false],
   //tooltips: [false, wNumb({decimals: 1}), true],
   range: {
     min: 0.0,
     max: 1
   }
});


slider1.noUiSlider.on("update", function(values, handle) {
   amp = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_amp")).innerHTML = amp.toString();
 });




setInterval(function () {
   for (let i=0; i<num; i++) {
      let y = Math.sin(i*Math.PI/100 + phi) + Math.random()/10;
      vert.set(i,1, 0.9*amp*y);
   }
   phi = phi + 0.01;
   
   wglp.update();
   
}, 16.67*3);