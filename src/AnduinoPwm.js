'use strict';

var PWM_INTERFACE_PINMAP = {
    '3': 3,
    '5': 5,
    '6': 6,
    '9': 9,
    '10': 10,
    '11': 11
};

var MAX_DUTY = 255;

function AnduinoPwm(device, name, options, args) {
    this._name = name;
    this._device = device;
    this._duty = 0;
    this._index = PWM_INTERFACE_PINMAP[args.pin];
}

AnduinoPwm.prototype.getFrequency = function (callback) {
    process.nextTick(function(){
        callback(undefined, 490);
    });
};

AnduinoPwm.prototype.setFrequency = function (frequency, callback) {
    process.nextTick(function(){
        callback(new Error("Arduino don't support change pwm frequency"));
    }); 
};

AnduinoPwm.prototype.getDuty = function (callback) {
    var that = this;

    process.nextTick(function(){
        callback(undefined, that._duty);
    });
};

AnduinoPwm.prototype.setDuty = function (duty, callback) {
    var pwmPin = this._index;

    if (duty > MAX_DUTY) {
        process.nextTick(function(){
            callback(new Error("Error duty argument"));
        });
    }

    this._device.pinMode(pwmPin, this._device.MODES.PWM);
    this._device.analogWrite(pwmPin, duty * MAX_DUTY);
    this._duty = duty;
    
    process.nextTick(function(){
        callback(undefined);
    });
};

module.exports = AnduinoPwm
