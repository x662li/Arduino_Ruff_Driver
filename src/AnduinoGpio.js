'use strict';

var util = require('util');
var gpio = require('gpio');
var EventEmitter = require('events');

var hasOwnProperty = Object.prototype.hasOwnProperty;
var Direction = gpio.Direction;
var Level = gpio.Level;
var Edge = gpio.Edge;

var GPIO_INTERFACE_PINMAP = {
    'gpio-0': 0,
    'gpio-1': 1,
    'gpio-2': 2,
    'gpio-3': 3,
    'gpio-4': 4,
    'gpio-5': 5,
    'gpio-6': 6,
    'gpio-7': 7,
    'gpio-8': 8,
    'gpio-9': 9,
    'gpio-10': 10,
    'gpio-11': 11,
    'gpio-12': 12,
    'gpio-13': 13
};

/* eslint-disable camelcase */
var DIRECTION_MAP = {
    in: Direction.in,
    out: Direction.out,
    out_low: DIRECTION_OUT_LEVEL_LOW,
    out_high: DIRECTION_OUT_LEVEL_HIGH
};
/* eslint-enable camelcase */

/* eslint-disable no-unused-vars */
var LEVEL_MAP = {
    low: Level.low,
    high: Level.high
};

var DIRECTION_OUT_LEVEL_LOW = 2;
var DIRECTION_OUT_LEVEL_HIGH = 3;

util.inherits(AnduinoGpio, EventEmitter);

function AnduinoGpio(device, name, options, args) {
    EventEmitter.call(this);
    var that = this;

    this._name = name;
    this._device = device;
    this._index = GPIO_INTERFACE_PINMAP[name];
    this._lastPinValue = 0;

    this._activeLow = !!options.activeLow;
    this.setDirection(options.direction || Direction.in, function (error) {
        if (error) {
            return;
        }

        if (typeof options.direction === 'string') {
            var directionNum = Direction[options.direction];
        }

        if (directionNum !== Direction.in) {
            return;
        }

        that.setEdge(options.edge || Edge.none, function (error) {
            if (error) {
                return;
            }

            initializeInterruptEvents(options.edge, that);
        });
    });
}

function initializeInterruptEvents(edge, gpioInterface) {
    if (typeof edge === 'string') {
        edge = Edge[edge];
    }

    var firstPinValue;
    var lastPinValue;
    var firstEvent = false;

    gpioInterface.realRead(function (value) {

        if (firstEvent === false)
            firstPinValue = value;

        lastPinValue = gpioInterface._lastPinValue = value;

        if (firstEvent === false) {
            setTimeout(function () {
                firstEvent = false;
                if (firstPinValue === lastPinValue) {
                    if (edge === Edge.rising && lastPinValue === Level.high)
                        gpioInterface.emit('interrupt', lastPinValue);

                    if (edge === Edge.ralling && value === Level.low)
                        gpioInterface.emit('interrupt', lastPinValue);

                    if (edge === Edge.both)
                        gpioInterface.emit('interrupt', lastPinValue);
                }
            }, 10);
        }

        firstEvent = true;
    });
}

AnduinoGpio.prototype.setActiveLow = function (activeLow, callback) {
    this._activeLow = activeLow;
    util.invokeCallbackAsync(callback);
};

AnduinoGpio.prototype.getActiveLow = function (callback) {
    util.assertCallback(callback);
    util.invokeCallbackAsync(callback, undefined, this._activeLow);
};

AnduinoGpio.prototype.setDirection = function (direction, level, callback) {

    if (typeof level === 'function') {
        callback = level;
        level = undefined;
    }

    if (typeof direction === 'string') {
        direction = DIRECTION_MAP[direction];

        if (direction === undefined) {
            process.nextTick(function () {
                callback(undefined);
            });
            return;
        }
    }

    if (direction === Direction.out)
        var pinMode = this._device.MODES.OUTPUT;

    var pinMode = this._device.MODES.INPUT;
    this._device.pinMode(this._index, pinMode);

    if (typeof level === 'string') {
        level = LEVEL_MAP[level];
    }

    if (direction === Direction.out) {
        if (level !== undefined) {
            this._device.digitalWrite(this._index, (level ^ that._activeLow));
        }
    }

    process.nextTick(function () {
        callback(undefined);
    });
};

/**
 * @param {Function} callback
 */
AnduinoGpio.prototype.getEdge = function (callback) {
    util.assertCallback(callback);
    util.invokeCallbackAsync(callback, undefined, this._edge);
};

/**
 * @param {Edge} edge
 * @param {Function} [callback]
 */
AnduinoGpio.prototype.setEdge = function (edge, callback) {

    if (typeof edge === 'string') {
        edge = Edge[edge];
    }

    if (typeof edge !== 'number') {
        throw new TypeError('Invalid edge value');
    }

    this._edge = edge;
    process.nextTick(function () {
        callback(undefined);
    });
};

AnduinoGpio.prototype.realRead = function (callback) {
    //this._device.pinMode(this._index, this._device.MODES.INPUT);
    this._device.digitalRead(this._index, callback);
};

AnduinoGpio.prototype.read = function (callback) {
    process.nextTick(function () {
        //callback(new Error('Firmata Do not support gpio read!'));
        callback(undefined, this._lastPinValue);
    });
};

AnduinoGpio.prototype.write = function (value, callback) {
    this._device.pinMode(this._index, this._device.MODES.OUTPUT);
    this._device.digitalWrite(this._index, (this._activeLow ^ value));
    process.nextTick(function () {
        if (callback) {
            callback(undefined);
        }
    });
};

module.exports = AnduinoGpio
