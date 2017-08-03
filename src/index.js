'use strict';
var driver = require('ruff-driver');
var util = require('util');

var gpio = require('gpio');

var _Debug = false;

var Board = require('./firmata');
var AnduinoGpio = require('./AnduinoGpio');
var AnduinoAdc = require('./AnduinoAdc');
var AnduinoPwm = require('./AnduinoPwm');
var AnduinoSerial = require('./AnduinoSerial');
var AnduinoI2c = require('./AnduinoI2c');

var interfaceMetadata = require('../driver.json').outputs;

var hasOwnProperty = Object.prototype.hasOwnProperty;

var OUTPUT_INTERFACE_MAP = {
    'gpio': AnduinoGpio,
    'adc': AnduinoAdc,
    'pwm': AnduinoPwm,
    'uart':AnduinoSerial,
    'i2c':AnduinoI2c
}

module.exports = driver({
    attach: function (inputs) {
        var self = this;
        this._uart = inputs['uart'];
        this.run();
        this._board = new Board(this, {
        },
        function(board) {
            console.log('--- arduino ready ---');
            self._ready = true;
            board.pins = require('./pins.json');
            // config i2c interface
            board.i2cConfig();
             //board.pinMode(5, board.MODES.ANALOG);
             //board.analogRead(5, function(value) {
             //    console.log('get adc0 value ', value);
             //});
        }
        );
    },

    detach: function () {
        this._detached = true;
    },

    getInterface: function(name, options) {
        if (!hasOwnProperty.call(interfaceMetadata, name)) {
            throw new Error('Invalid interface name "' + name + '"');
        }
        var interfaceType = interfaceMetadata[name].type;

        if (!hasOwnProperty.call(OUTPUT_INTERFACE_MAP, interfaceType)) {
            throw new Error('Invalid interface Type "' + interfaceType + '"');
        }

        var InterfaceClass = OUTPUT_INTERFACE_MAP[interfaceType];

        var args = interfaceMetadata[name].args;
        return new InterfaceClass(this._board, name, options, args);
    },

    exports: {
        write: function (buffer) {
            if (_Debug) {
                console.log('> send: ', buffer.toString('hex'));
            }
            this._uart.write(buffer);
        },

        run: function(readyFn) {
            var readOnce = (function (error, data) {
                if (error) {
                    this.emit('error', error);
                } else if (!this._detached) {
                    if (_Debug) {
                        console.log('reveive: ', data.toString('hex'));
                    }
                    this.emit('data', data);
                    this._uart.read(readOnce);
                }
            }).bind(this);

            if (readyFn) {
                this._board.on("ready", readyFn);
            }
            this._uart.read(readOnce);
        }
    }
});
