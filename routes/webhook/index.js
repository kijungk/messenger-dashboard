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

      const userId = knex('users').where({ facebook_id: senderId })
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

            rp(options)
              .then((response) => {
                const user = JSON.parse(response);
                return knex('users')
                  .returning('id')
                  .insert({
                    facebook_id: user.id,
                    name: user.name
                  })
              })
              .then((result) => {
                console.log(result[0]);
                return result[0];
              })
              .catch((error) => {
                //Todo error log
                //Inserting new user failed
              });
          }

          console.log(result);
          return result.id;
        })
        .catch((error) => {
          //Todo error log
          //finding user in database failed
        });

      console.log(userId);
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