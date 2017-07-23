#! /usr/bin/env node
'use strict';

const fs = require('fs');
const robot = require('robotjs');

const DEFAULT_DEVICE_PATH = '/dev/usb/hiddev0';
const DEFAULT_KEYS = ['a', 'b', 'c'];
const RETRY_INTERVAL = 5 * 1000;

const argv = require('yargs')
             .array('k')
             .alias('k', 'keys')
             .alias('p', 'path')
             .default('path', DEFAULT_DEVICE_PATH)
             .default('k', [])
             .argv;

const keyMap = DEFAULT_KEYS.map((key, i) => (argv.keys[i] || key));
const state = [ false, false, false ];

function updateState(index, value) {
  const previousState = state[index];
  const currentState = (value === 0x01);

  if (previousState !== currentState) {
    const key = keyMap[index];
    robot.keyToggle(key, currentState ? 'down' : 'up');
  }

  state[index] = currentState;
}

function openFile() {
  const stream = fs.createReadStream(argv.path);
  const size = 8;
  const offset = 4;

  stream.on('data', function(chunk) {
    for (var i=0; i<chunk.length / size; i++) {
      updateState(i, chunk[i * size + offset]);
    }
  });

  stream.on('error', function(err) {
    console.log('failed to open file', err);
    setTimeout(openFile, RETRY_INTERVAL);
  });
}

openFile();
