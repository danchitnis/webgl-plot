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
let freq = 1;
let phi_delta=1;

for (let i=0; i<num; i++) {
   //set x to -num/2:1:+num/2
   vert.set(i, 0, 2*i/num-1);
}

let phi = 0;




//sliders
let slider_amp = document.getElementById('slider_amp') as noUiSlider.Instance;
let slider_freq = document.getElementById('slider_freq') as noUiSlider.Instance;
let slider_phid = document.getElementById('slider_phid') as noUiSlider.Instance;

noUiSlider.create(slider_amp, {
   start: [0.5],
   connect: [true, false],
   //tooltips: [false, wNumb({decimals: 1}), true],
   range: {
     min: 0.0,
     max: 1
   }
});

noUiSlider.create(slider_freq, {
   start: [0.5],
   connect: [true, false],
   //tooltips: [false, wNumb({decimals: 1}), true],
   range: {
     min: 0.0,
     max: 1
   }
});

noUiSlider.create(slider_phid, {
   start: [0.5],
   connect: [true, false],
   //tooltips: [false, wNumb({decimals: 1}), true],
   range: {
     min: 0.0,
     max: 1
   }
});


slider_amp.noUiSlider.on("update", function(values, handle) {
   amp = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_amp")).innerHTML = amp.toString();
 });

 slider_freq.noUiSlider.on("update", function(values, handle) {
   freq = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_freq")).innerHTML = freq.toString();
 });

 slider_phid.noUiSlider.on("update", function(values, handle) {
   phi_delta = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_phid")).innerHTML = phi_delta.toString();
 });



setInterval(function () {
   for (let i=0; i<num; i++) {
      let y = Math.sin(i*freq*Math.PI/100 + phi) + Math.random()/10;
      vert.set(i,1, 0.9*amp*y);
   }
   phi = phi + phi_delta*0.1;
   
   wglp.update();
   
}, 16.67*3);