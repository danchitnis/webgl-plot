"use strict";
/**
 * Author Danial Chitnis 2019
 */
exports.__esModule = true;
var ndarray = require("ndarray");
var webGLplot_1 = require("./webGLplot");
var webGLplot_2 = require("./webGLplot");
var webGLplot_3 = require("./webGLplot");
var noUiSlider = require("nouislider");
var canv = document.getElementById("my_canvas");
var devicePixelRatio = window.devicePixelRatio || 1;
var num = Math.round(canv.clientWidth * devicePixelRatio);
//let num=1000;
var line_color1 = new webGLplot_2.color_rgba(1, 1, 0, 1);
var line_color2 = new webGLplot_2.color_rgba(1, 0, 0, 1);
var lg1 = new webGLplot_3.lineGroup(line_color1);
var lg2 = new webGLplot_3.lineGroup(line_color2);
lg1.xy = ndarray(new Float32Array(num * 2), [num, 2]);
lg2.xy = ndarray(new Float32Array(num * 2), [num, 2]);
var wglp = new webGLplot_1.webGLplot(canv, [lg1, lg2]);
console.log(num);
//amplitude
var Samp = 1;
var Namp = 1;
var freq = 1;
var phi_delta = 1;
for (var i = 0; i < num; i++) {
    //set x to -num/2:1:+num/2
    lg1.xy.set(i, 0, 2 * i / num - 1);
    lg1.xy.set(i, 1, 0);
    lg2.xy.set(i, 0, 2 * i / num - 1);
    lg2.xy.set(i, 1, 0);
}
var phi = 0;
//sliders
var slider_Samp = document.getElementById('slider_Samp');
var slider_Namp = document.getElementById('slider_Namp');
var slider_freq = document.getElementById('slider_freq');
var slider_phid = document.getElementById('slider_phid');
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
slider_Samp.noUiSlider.on("update", function (values, handle) {
    Samp = parseFloat(values[handle]);
    document.getElementById("display_Samp").innerHTML = Samp.toString();
});
slider_Namp.noUiSlider.on("update", function (values, handle) {
    Namp = parseFloat(values[handle]);
    document.getElementById("display_Namp").innerHTML = Namp.toString();
});
slider_freq.noUiSlider.on("update", function (values, handle) {
    freq = parseFloat(values[handle]);
    document.getElementById("display_freq").innerHTML = freq.toString();
});
slider_phid.noUiSlider.on("update", function (values, handle) {
    phi_delta = parseFloat(values[handle]);
    document.getElementById("display_phid").innerHTML = phi_delta.toString();
});
setInterval(function () {
    random_walk();
    wglp.update();
}, 16.67 * 1);
function random_walk() {
    for (var i = 0; i < num - 1; i++) {
        lg1.xy.set(i, 1, lg1.xy.get(i + 1, 1));
        lg2.xy.set(i, 1, lg2.xy.get(i + 1, 1));
    }
    var y1 = lg1.xy.get(num - 1, 1) + 0.02 * (Math.round(Math.random()) - 0.5);
    var y2 = lg2.xy.get(num - 1, 1) + 0.02 * (Math.round(Math.random()) - 0.5);
    lg1.xy.set(num - 1, 1, y1);
    lg2.xy.set(num - 1, 1, y2);
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
