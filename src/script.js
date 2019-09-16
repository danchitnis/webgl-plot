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
var line_num = 100;
var line_colors;
var lines;
line_colors = [];
lines = [];
for (var i = 0; i < line_num; i++) {
    line_colors.push(new webGLplot_2.color_rgba(Math.random(), Math.random(), Math.random(), 1.0));
    lines.push(new webGLplot_3.lineGroup(line_colors[i]));
}
lines.forEach(function (line) {
    line.xy = ndarray(new Float32Array(num * 2), [num, 2]);
});
var wglp = new webGLplot_1.webGLplot(canv, lines);
console.log(num);
//amplitude
var Samp = 1;
var Namp = 1;
var freq = 1;
var phi_delta = 1;
var _loop_1 = function (i) {
    //set x to -num/2:1:+num/2
    lines.forEach(function (line) {
        line.xy.set(i, 0, 2 * i / num - 1);
        line.xy.set(i, 1, 0);
    });
};
for (var i = 0; i < num; i++) {
    _loop_1(i);
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
function new_frame() {
    random_walk();
    wglp.update();
    window.requestAnimationFrame(new_frame);
}
window.requestAnimationFrame(new_frame);
function random_walk() {
    var _loop_2 = function (i) {
        lines.forEach(function (line) {
            line.xy.set(i, 1, line.xy.get(i + 1, 1));
        });
    };
    for (var i = 0; i < num - 1; i++) {
        _loop_2(i);
    }
    lines.forEach(function (line) {
        var y = line.xy.get(num - 1, 1) + 0.01 * (Math.round(Math.random()) - 0.5);
        line.xy.set(num - 1, 1, y);
    });
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
