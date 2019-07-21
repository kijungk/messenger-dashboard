const
  express = require('express'),
  { httpStatusCodes } = require('../../utilities/constants'),
  { assignPayload, processEntryId } = require('../../utilities/handlers/eventHandler'),
  { processPayload } = require('../../utilities/handlers/payloadHandler'),
  { sendMessage } = require('../../utilities/handlers/sendHandler'),
  knex = require('../../db/knex'),
  rp = require('request-promise'),
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
      const
        entryId = entry.id,
        event = entry.messaging[0],
        senderId = event.sender.id,
        access_token = processEntryId(entryId);

      knex('users').where({ facebook_id: senderId })
        .then((result) => {
          if (!result.length) {
            const options = {
              uri: `https://graph.facebook.com/${senderId}`,
              qs: {
                fields: 'name',
                access_token
              },
              method: 'GET'
            };

            return rp(options);
          }
        })
        .then((fb_user) => {
          console.log('hit');
          const user = JSON.parse(fb_user);
          return knex('users').insert({ name: user.name, facebook_id: user.id });
        })


      let payload = '';

      payload = assignPayload(event);

      const message = processPayload(entryId, payload);

      return sendMessage(access_token, senderId, message);
    });

    return response.status(httpStatusCodes.ok).json({
      message: 'Event successfully received.'
    });
  })
module.exports = router;