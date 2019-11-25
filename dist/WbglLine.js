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
var WebglLine = /** @class */ (function (_super) {
    __extends(WebglLine, _super);
    function WebglLine(c, num) {
        var _this = _super.call(this) || this;
        _this.webglNumPoints = num;
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
    WebglLine.prototype.setX = function (index, x) {
        this.xy[index * 2] = x;
    };
    WebglLine.prototype.setY = function (index, y) {
        this.xy[index * 2 + 1] = y;
    };
    WebglLine.prototype.getX = function (index) {
        return this.xy[index * 2];
    };
    WebglLine.prototype.getY = function (index) {
        return this.xy[index * 2 + 1];
    };
    WebglLine.prototype.linespaceX = function () {
        for (var i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setX(i, 2 * i / this.numPoints - 1);
        }
    };
    WebglLine.prototype.constY = function (c) {
        for (var i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    };
    WebglLine.prototype.shift_add = function (data) {
        var shiftSize = data.length;
        for (var i = 0; i < this.numPoints - shiftSize; i++) {
            this.setY(i, this.getY(i + shiftSize));
        }
        for (var i = 0; i < shiftSize; i++) {
            this.setY(i + this.numPoints - shiftSize, data[i]);
        }
    };
    return WebglLine;
}(WebglBaseLine_1.WebglBaseLine));
exports.WebglLine = WebglLine;
//# sourceMappingURL=WbglLine.js.map