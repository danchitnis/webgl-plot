"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var WebglBaseLine_1 = require("./WebglBaseLine");
var WebglStep = /** @class */ (function (_super) {
    __extends(WebglStep, _super);
    function WebglStep(c, num) {
        var _this = _super.call(this) || this;
        _this.webglNumPoints = num * 2;
        _this.numPoints = num;
        _this.color = c;
        _this.intenisty = 1;
        _this.xy = new Float32Array(2 * _this.webglNumPoints);
        _this.vbuffer = 0;
        _this.prog = 0;
        _this.coord = 0;
        _this.visible = true;
        return _this;
    }
    WebglStep.prototype.setY = function (index, y) {
        this.xy[index * 4 + 1] = y;
        this.xy[index * 4 + 3] = y;
    };
    WebglStep.prototype.getX = function (index) {
        return this.xy[index * 4];
    };
    WebglStep.prototype.getY = function (index) {
        return this.xy[index * 4 + 1];
    };
    WebglStep.prototype.linespaceX = function (start, stepsize) {
        for (var i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.xy[i * 4] = start + (i * stepsize);
            this.xy[i * 4 + 2] = start + (i * stepsize + stepsize);
        }
    };
    WebglStep.prototype.constY = function (c) {
        for (var i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    };
    WebglStep.prototype.shiftAdd = function (data) {
        var shiftSize = data.length;
        for (var i = 0; i < this.numPoints - shiftSize; i++) {
            this.setY(i, this.getY(i + shiftSize));
        }
        for (var i = 0; i < shiftSize; i++) {
            this.setY(i + this.numPoints - shiftSize, data[i]);
        }
    };
    return WebglStep;
}(WebglBaseLine_1.WebglBaseLine));
exports.WebglStep = WebglStep;
//# sourceMappingURL=WbglStep.js.map