module.exports = (function () {
  //const responseBuilder = require('../builders/responseBuilder');
  const
    { entryIds } = require('../constants/index'),
    Attachment = require('../models/Attachment'),
    Button = require('../models/Button'),
    Element = require('../models/Element'),
    Message = require('../models/Message');


  function assignPayload(event) {
    switch (true) {
      case !!event.referral:
        return event.referral.ref;

      case !!event.message:
        return event.message.text;

      case !!event.postback:
        return event.postback.payload;
    }
  }

  function processEntryId(entryId) {
    switch (entryId) {
      case entryIds.FMS2019:
        return process.env.FMS2019;

      case entryIds.OXC2019:
        return process.env.OXC2019;

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