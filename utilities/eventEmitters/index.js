module.exports = (function eventEmitters() {
  const
    EventEmitter = require('events').EventEmitter,
    appEventEmitter = new EventEmitter();

  return appEventEmitter;
})();