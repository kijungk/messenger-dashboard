module.exports = (function payloadHandler() {
  const
    { entryIds } = require('../constants/index'),
    { processFMS2019Payload, processOXC2019Payload } = require('./responseHandler');

  function processPayload(entryId, payload) {
    switch (entryId) {
      case entryIds.FMS2019:
        processFMS2019Payload(payload);
        break;

      case entryIds.OXC2019:
        processOXC2019Payload(payload);
        break;
    }
  }

  return {
    processPayload: processPayload
  }
})();