'use strict';

var util = require('util');

function AnduinoI2c(device, name, options, args) {
    this._name = name;
    this._device = device;
    this._address = options.address;
}

AnduinoI2c.prototype.writeByte = function (command, buffer, callback) {


    if (command == -1) {
        this._device.i2cWrite(this._address, buffer);
    } else {
        this._device.i2cWrite(this._address, command, buffer);
    }
    process.nextTick(function(){
        callback && callback(undefined);
    });
}

AnduinoI2c.prototype.writeBytes = AnduinoI2c.prototype.writeByte;

AnduinoI2c.prototype.writeWord = AnduinoI2c.prototype.writeByte;

AnduinoI2c.prototype.readByte = function (command, callback) {
    var maxBytesToRead = 1;
    this.readBytes(command, maxBytesToRead, callback);
}

AnduinoI2c.prototype.readWord = function (command, callback) {
    var maxBytesToRead = 2;
    this.readBytes(command, maxBytesToRead, callback);
}

AnduinoI2c.prototype.readBytes = function (command, length, callback) {
    var that = this;
    var maxBytesToRead = length;
    
    var options = {
        address: this._address,
        command: command
    };

    var realReadCallback = function(data) {
        //that._device.i2cStop(options);
        callback(undefined, data);
    }

    if (command == -1) {
        this._device.i2cReadOnce(this._address, maxBytesToRead, realReadCallback);
    } else {
        this._device.i2cReadOnce(this._address, command, maxBytesToRead, realReadCallback);
    }
}

module.exports = AnduinoI2c
