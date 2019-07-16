module.exports = (function payloadHandler() {
  const
    { entryIds } = require('../constants/index'),
    { processFMS2019Payload, processOXC2019Payload } = require('./responseHandler');

  function processPayload(entryId, payload) {
    switch (entryId) {
      case entryIds.FMS2019:
        return processFMS2019Payload(payload);

      case entryIds.OXC2019:
        return processOXC2019Payload(payload);
    }
  }

  return {
    processPayload: processPayload
  }
})();