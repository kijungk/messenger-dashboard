module.exports = (function() {
  const
    { entryIds } = require('../constants/index');

  function assignPayload(event) {
    switch (true) {
      case !!event.referral:
        return event.referral.ref;

      case !!event.message:
        if (event.message.quick_reply) {
          return event.message.quick_reply.payload;
        }

        return event.message.text;

      case !!event.postback:
        if (event.postback.referral) {
          return event.postback.referral.ref;
        }

        return event.postback.payload;
    }
  }

  function processEntryId(entryId) {
    switch (entryId) {
      case entryIds.FMS2019:
        return process.env.FMS2019;

      case entryIds.CXO2019:
        return process.env.CXO2019;

      default:
        //throw error. entry from unauthorized source page
        break;
    }
  }

  return {
    assignPayload: assignPayload,
    processEntryId: processEntryId
  };
})();