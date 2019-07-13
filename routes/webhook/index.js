const
  express = require('express'),
  { httpStatusCodes } = require('../../utilities/constants'),
  { processPayload } = require('../../utilities/handlers/eventHandler'),
  sendHandler = require('../../utilities/handlers/sendHandler'),
  router = express.Router();

router.route('/')
  .get((request, response) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const
      mode = request.query['hub.mode'],
      token = request.query['hub.verify_token'],
      challenge = request.query['hub.challenge'];

    if (!mode || !token) {
      return response.status(httpStatusCodes.badRequest).json({
        message: 'Token verification has failed. Please input a mode and a token.'
      });
    }

    if (mode !== 'subscribe' || token !== VERIFY_TOKEN) {
      return response.status(httpStatusCodes.forbidden).json({
        message: 'Token verification has failed. Please check your mode and token.'
      });
    }

    return response.status(httpStatusCodes.ok).send(challenge);
  })

  .post((request, response) => {
    const body = request.body;

    if (body.object !== 'page') {
      // TODO error log
      return response.status(httpStatusCodes.notFound).json({
        message: 'POST request to /webhook has failed. Please check that the event is from a page subscription.'
      });
    }
    body.entry.forEach((entry) => {
      // differentiate between message event and referral event here
      const event = entry.messaging[0];

      // event.referral.ref has the ref param.

      const entryId = entry.id;

      const senderId = event.sender.id;
      let payload = '';

      if (event.message) {
        // differentiate between user inputs and assign payload here
        payload = event.message.text;
      }

      if (event.postback) {
        payload = event.postback.payload;
      }

      const message = processPayload(payload);

      return sendHandler.send(entryId, senderId, message);
    });

    return response.status(httpStatusCodes.ok).json({
      message: 'Event successfully received.'
    });
  })
module.exports = router;