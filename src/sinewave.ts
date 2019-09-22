/**
 * Author Danial Chitnis 2019
 */

import ndarray = require("ndarray");
import { webGLplot} from "./webGLplot"
import { color_rgba} from "./webGLplot"
import { lineGroup } from "./webGLplot"
import * as noUiSlider from 'nouislider';


let canv = <HTMLCanvasElement>document.getElementById("my_canvas");


let devicePixelRatio = window.devicePixelRatio || 1;
let num = Math.round(canv.clientWidth * devicePixelRatio);
//let num=1000;



let line_num = 100;
let line_colors : Array<color_rgba>;
let lines : Array<lineGroup>;

line_colors = [];
lines = [];

for(let i = 0; i < line_num; i++) {
  line_colors.push(new color_rgba(Math.random(), Math.random(), Math.random(), 1.0));
  lines.push(new lineGroup(line_colors[i]));
}

lines.forEach(line => {
  line.xy = ndarray(new Float32Array(num*2), [num, 2]);
});



let wglp = new webGLplot(canv, lines);



console.log(num);

//amplitude
let Samp = 1; 
let Namp = 1;
let freq = 1;
let phi_delta=1;

for (let i=0; i<num; i++) {
  //set x to -num/2:1:+num/2
  lines.forEach(line => {
    line.xy.set(i, 0, 2*i/num-1);
    line.xy.set(i, 1, 0);
  });
}



let phi = 0;




//sliders
let slider_Samp = document.getElementById('slider_Samp') as noUiSlider.Instance;
let slider_Namp = document.getElementById('slider_Namp') as noUiSlider.Instance;
let slider_freq = document.getElementById('slider_freq') as noUiSlider.Instance;
let slider_phid = document.getElementById('slider_phid') as noUiSlider.Instance;

noUiSlider.create(slider_Samp, {
   start: [0.5],
   connect: [true, false],
   //tooltips: [false, wNumb({decimals: 1}), true],
   range: {
     min: 0.0,
     max: 1
   }
});

noUiSlider.create(slider_Namp, {
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


slider_Samp.noUiSlider.on("update", function(values, handle) {
   Samp = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_Samp")).innerHTML = Samp.toString();
 });

 slider_Namp.noUiSlider.on("update", function(values, handle) {
   Namp = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_Namp")).innerHTML = Namp.toString();
 });

 slider_freq.noUiSlider.on("update", function(values, handle) {
   freq = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_freq")).innerHTML = freq.toString();
 });

 slider_phid.noUiSlider.on("update", function(values, handle) {
   phi_delta = parseFloat(values[handle]);
   (<HTMLParagraphElement>document.getElementById("display_phid")).innerHTML = phi_delta.toString();
 });





function new_frame() {
  wglp.update();
  window.requestAnimationFrame(new_frame);
}

window.requestAnimationFrame(new_frame);




/*function sinwave() {
  for (let i=0; i<num; i++) {
    let y1= Math.sin(i*freq*Math.PI/100 + phi) + Math.random()*Namp/1;
    lg1.xy.set(i,1, 0.9*0.5*Samp*y1+0.25);
  
    let y2= Math.sin(i*freq*Math.PI/100 + phi) + Math.random()*Namp/1;
    lg2.xy.set(i,1, 0.9*0.5*Samp*y2-0.25);
  }
  phi = phi + phi_delta*0.5;
}*/