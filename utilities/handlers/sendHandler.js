module.exports = (function () {
  const
    rp = require('request-promise'),
    { processEntryId } = require('../handlers/eventHandler');

  function send(entryId, recipientId, content) {
    const body = {
      recipient: {
        id: recipientId
      },
      message: content
    };

    const options = {
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        // Need to parameterize this based on page entry id
        access_token: processEntryId(entryId)
      },
      method: 'POST',
      json: body
    };

    rp(options)
      .then((response) => {
        console.log(`Message successfully sent to recipient: ${response.recipient_id}`);
      })
      .catch((error) => {
        // TODO: error log
        console.log(`Error during POST operation to Send API:\n\n${error}\n\n`)
        return;
      });
  }

  return {
    send: send
  };
})();