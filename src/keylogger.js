// src/keylogger.js

const { uIOhook } = require('uiohook-napi');

function throttle(callback, limit) {
  let waiting = false;
  return function() {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(function() {
        waiting = false;
      }, limit);
    }
  };
}

class Keylogger {
  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.startTime = Date.now();
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
  }

  startLogging() {
    if (this.isLogging) return;
    this.isLogging = true;
  
    uIOhook.on('keydown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Keycode ${e.keycode}`);
    });

    uIOhook.on('mousedown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse button ${e.button} down`);
    });
  
    const throttledMouseMove = throttle((e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
    }, this.mouseLogInterval);
  
    uIOhook.on('mousemove', throttledMouseMove);

    const logScroll = throttle((e) => {
      const timestamp = this.getFormattedTime();
      const axis = e.direction == 3 ? 'Vertical' : 'Horizontal';
      const direction = axis == 'Vertical' ? (e.rotation > 0 ? 'UP' : 'DOWN') : (e.rotation > 0 ? 'LEFT' : 'RIGHT');
      this.logEntries.push(`${timestamp}: Scrolled ${axis}, Direction: ${direction}, Intensity: ${e.rotation < 0 ? e.rotation * -1 : e.rotation}`);
    }, this.scrollLogInterval);

    uIOhook.on('wheel', logScroll);
  
    uIOhook.start();
  }
  

  getFormattedTime() {
    const time = Date.now() - this.startTime;
    let milliseconds = (time % 1000),
        seconds = Math.floor((time / 1000) % 60),
        minutes = Math.floor((time / (1000 * 60)) % 60),
        hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    milliseconds = milliseconds.toString().padStart(3, '0');
    
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
  }  

  stopLogging() {
    if (!this.isLogging) return;
    this.isLogging = false;
    uIOhook.removeAllListeners();
    uIOhook.stop(); 
    const logContent = this.logEntries.join('\n');
    this.logEntries = [];
    return logContent;
  }
}

module.exports = Keylogger;
