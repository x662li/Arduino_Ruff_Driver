'use strict';

var util = require('util');
var referenceVoltage = 5;

var ADC_INTERFACE_PINMAP = {
    'adc-0': 0,
    'adc-1': 1,
    'adc-2': 2,
    'adc-3': 3,
    'adc-4': 4,
    'adc-5': 5
};

function AnduinoAdc(device, name, options, args) {
    this._name = name;
    this._device = device;
    this._index = ADC_INTERFACE_PINMAP[name];
}

AnduinoAdc.prototype.getVoltage = function (callback) {
    var that = this;
    var analogPin = this._index;
    
    var realRead = function(value) {
        process.nextTick(function(){
            var voltage = value * 5 / 1024;
            callback(undefined, voltage.toFixed(2));
        });

        // read only once for ADC
        that._device.disableAnalogRead(analogPin, realRead);
    }

    this._device.pinMode(analogPin, this._device.MODES.ANALOG);
    this._device.analogRead(analogPin, realRead);
}

module.exports = AnduinoAdc
