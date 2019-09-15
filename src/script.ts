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


let line_color1 = new color_rgba(1,1,0,1);
let line_color2 = new color_rgba(1,0,0,1);

let lg1 = new lineGroup(line_color1);
let lg2 = new lineGroup(line_color2);

lg1.xy = ndarray(new Float32Array(num*2), [num, 2]);
lg2.xy = ndarray(new Float32Array(num*2), [num, 2]);

let wglp = new webGLplot(canv, [lg1, lg2]);



console.log(num);

//amplitude
let Samp = 1; 
let Namp = 1;
let freq = 1;
let phi_delta=1;

for (let i=0; i<num; i++) {
   //set x to -num/2:1:+num/2
   lg1.xy.set(i, 0, 2*i/num-1);
   lg1.xy.set(i, 1, 0);
   lg2.xy.set(i, 0, 2*i/num-1);
   lg2.xy.set(i, 1, 0);
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




setInterval(function () {

  random_walk();
  
  wglp.update();
   
}, 16.67*1);


function random_walk() {
  for (let i=0; i<num-1; i++) {
    lg1.xy.set(i,1, lg1.xy.get(i+1,1));
    lg2.xy.set(i,1, lg2.xy.get(i+1,1));
    
  }
  let y1 = lg1.xy.get(num-1,1) + 0.02 * (Math.round(Math.random()) -0.5);
  let y2 = lg2.xy.get(num-1,1) + 0.02 * (Math.round(Math.random()) -0.5);

  lg1.xy.set(num-1,1,y1);
  lg2.xy.set(num-1,1,y2);

}

/*function sinwave() {
  for (let i=0; i<num; i++) {
    let y1= Math.sin(i*freq*Math.PI/100 + phi) + Math.random()*Namp/1;
    lg1.xy.set(i,1, 0.9*0.5*Samp*y1+0.25);
  
    let y2= Math.sin(i*freq*Math.PI/100 + phi) + Math.random()*Namp/1;
    lg2.xy.set(i,1, 0.9*0.5*Samp*y2-0.25);
  }
  phi = phi + phi_delta*0.5;
}*/