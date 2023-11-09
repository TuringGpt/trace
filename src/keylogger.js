// src/keylogger.js

const { uIOhook } = require('uiohook-napi');

class Keylogger {
  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.startTime = Date.now();
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 1000;
  }

  startLogging() {
    if (this.isLogging) return;
    this.isLogging = true;
  
    // Throttle mousemove event to fire only once per interval
    const throttle = (func, limit) => {
      let lastFunc;
      let lastRan;
      return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
        } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(function() {
            if ((Date.now() - lastRan) >= limit) {
              func.apply(context, args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      }
    };
  
    uIOhook.on('keydown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Keycode ${e.keycode}`);
    });
    uIOhook.on('mousedown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse button ${e.button} down`);
    });
    uIOhook.on('mouseup', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse button ${e.button} up`);
    });
  
    const throttledMouseMove = throttle((e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse moved to x:${e.x}, y:${e.y}`);
    }, this.mouseLogInterval);
  
    uIOhook.on('mousemove', throttledMouseMove);
  
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