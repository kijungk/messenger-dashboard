module.exports = (function payloadHandler() {
  const
    { entryIds } = require('../constants/index'),
    { processFMS2019Response, processOXC2019Response } = require('./responseHandler');

  function processPayload(accessToken, entryId, userId, payload, senderId) {
    switch (entryId) {
      case entryIds.FMS2019:
        return processFMS2019Response(accessToken, payload, userId, senderId);

      case entryIds.OXC2019:
        return processOXC2019Response(accessToken, payload, userId, senderId);
    }
  }

  return {
    processPayload: processPayload
  }
})();