const
  express = require('express'),
  router = express.Router();

const
  { processEntryId } = require('../../utilities/handlers/eventHandler'),
  { entryIds, entryIdLabels } = require('../../utilities/constants/index'),
  Message = require('../../utilities/models/Message');


router.route('/')
  .post((request, response) => {
    const { text, eventId } = request.body;

    const message = new Message(text);

    console.log(message);

    sendBroadcast(message, eventId);
    return response.sendStatus(200);
  });

function sendBroadcast(message, eventId) {
  let
    access_token,
    pageLabel;

  if (eventId == 1) {
    access_token = processEntryId(entryIds.FMS2019);
    pageLabel = entryIdLabels[entryIds.FMS2019];
  }

  if (eventId == 2) {
    access_token = processEntryId(entryIds.CXO2019);
    pageLabel = entryIdLabels[entryIds.CXO2019];
  }

  const options = {
    uri: 'https://graph.facebook.com/v2.11/me/message_creatives',
    method: 'POST',
    qs: {
      access_token
    },
    json: {
      messages: [message]
    }
  }

  return rp(options)
    .then((result) => {
      console.log(result);
      const broadcastObject = {
        message_creative_id: result.body.message_creative_id,
        notification_type: "REGULAR",
        messaging_type: "MESSAGE_TAG",
        tag: "NON_PROMOTIONAL_SUBSCRIPTION",
        custom_label_id: pageLabel
      }

      const broadcastOptions = {
        uri: 'https://graph.facebook.com/v2.11/me/broadcast_messages',
        qs: {
          access_token
        },
        method: "POST",
        json: broadcastObject
      }

      return rp(broadcastOptions);
    })
    .then((result) => {
      console.log(result);
      return;
    })
    .catch((error) => {
      console.log(error);
      //error while sending broadcast
      return;
    });
}
module.exports = router;