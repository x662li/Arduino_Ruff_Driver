'use strict';
var driver = require('ruff-driver');
var Gpio = require('gpio');
var I2C = require('i2c');
var mixin = require('util').mixin;

var _isDebug = true;
var Board = require('./firmata');

function VGpio(inputs, adapter, pin) {
    this._adapter = adapter;
    this._pin = 13;
}

VGpio.prototype.setDirection = function () {

};

VGpio.prototype.setEdge = function () {

};

VGpio.prototype.setActiveLow = function () {

};

VGpio.prototype.read = function () {

};

VGpio.prototype.write = function (value) {
    this._adapter.digitalWrite(this._pin, value);
};

function VI2c(inputs, adapter) {
    this._adapter = adapter;
};

VI2c.prototype.readByte = function() {

};
VI2c.prototype.readWord = function() {

};
VI2c.prototype.readBytes = function() {

};

VI2c.prototype.writeByte = function(command, value) {
    var address = 63;
    // console.log('command, value = ', command, value);
    this._adapter._board.i2cWrite(address, [value]);
};
VI2c.prototype.writeWord = function(command, value) {

};
VI2c.prototype.writeBytes = function(command, values) {

};

module.exports = driver({
    attach: function (inputs) {
        console.log('--- attach ---');

        var self = this;
        this._uart = inputs.getRequired('uart');
        this.run();

        this._board = new Board(this, {
            // skipCapabilities: true,
        }
        , function (board) {
            console.log('--- arduino ready ---');
            self._ready = true;

            board.pins = require('./pins.json');

            board.i2cConfig();

            board.pinMode(13, board.MODES.OUTPUT);

            // board.pinMode(8, board.MODES.INPUT);
            // board.digitalRead(8, function(value) {
            //     console.log('digitalRead: %j', value);
            // });
        }
        );
    },

    detach: function () {
        this._detached = true;
    },

    getDevice: function(key, inputs) {
        function TemplateGpio() {}
        function TemplateI2c() {}

        if (key === 'gpio-13') {
            var pin = 13;
            inputs.setValue('pin', pin);
            mixin(TemplateGpio, [VGpio]);
            var GpioClass = Gpio.driver({
                attach: function(inputs, adapter, index) {
                    VGpio.call(this, inputs, adapter, index);
                },

                exports: TemplateGpio.prototype
            });

            var gpio = new GpioClass(inputs, this, pin);
            return gpio;
        } if (key === 'gpio-8') {
            var pin = 8;
            inputs.setValue('pin', pin);
            mixin(TemplateGpio, [VGpio]);
            var GpioClass = Gpio.driver({
                attach: function(inputs, adapter, index) {
                    VGpio.call(this, inputs, adapter, index);
                },

                exports: TemplateGpio.prototype
            });

            var gpio = new GpioClass(inputs, this, pin);
            var board = this._board;
            board.pinMode(pin, board.MODES.INPUT);
            board.digitalRead(pin, function(value) {
                // console.log('digitalRead: %j', value);
                gpio.emit('interrupt', value);
            });

            return gpio;
        } else if (key.indexOf('i2c') >= 0) {
            var pin = 23;
            inputs.setValue('pin', pin);
            mixin(TemplateI2c, [VI2c]);
            var I2cClass = I2C.driver({
                attach: function(inputs, adapter, index) {
                    VI2c.call(this, inputs, adapter, index);
                },

                exports: TemplateI2c.prototype
            });
            var i2c = new I2cClass(inputs, this, pin);
            return i2c;
        }
    },

    exports: {
        digitalWrite: function (pin, value) {
            if (_isDebug) {
                console.log('> send: ', value);
            }
            if (!this._ready) {
                throw new Error('not ready when digitalWrite');
            }
            this._board.digitalWrite(pin, value);
        },

        write: function (buffer) {
            if (_isDebug) {
                console.log('> send: ', buffer.toString('hex'));
            }

            this._uart.writeSync(buffer);
        },

        run: function(readyFn) {
            console.log('--- run ---');
            var readOnce = (function (error, data) {
                if (error) {
                    this.emit('error', error);
                } else if (!this._detached) {
                    if (_isDebug) {
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
