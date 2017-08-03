'use strict';

var util = require('util');

function AnduinoSerial(device, name, options, args) {
    var that = this;

    this._name = name;
    this._device = device;
    this._portId = this._device.SERIAL_PORT_IDs[args.portId];

    this._device.serialConfig({
        portId: that._portId,
        baud: options.baud,
        rxPin: args.rxPin,
        txPin: args.txPin
    });
}

AnduinoSerial.prototype.write = function (buffer, callback) {
    this._device.serialWrite(this._portId, buffer);
    process.nextTick(function(){
        callback && callback(undefined);
    });
}

AnduinoSerial.prototype.read = function (callback) {
    var maxBytesToRead = 16;
    this._device.serialRead(this._portId, maxBytesToRead, callback);
}

module.exports = AnduinoSerial
