const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

const
  Message = require('../../utilities/models/Message'),
  QuickReply = require('../../utilities/models/QuickReply'),
  { sendMessage } = require('../../utilities/handlers/sendHandler');

router.route('/')
  .get((request, response) => {
    return knex.raw(`
      SELECT
        o.id,
        o.created_at,
        p.description,
        p.vendor_id
      FROM
        orders o
      JOIN
        events e
        ON e.id = o.event_id
        AND e.description = 'FMS 2019'
      JOIN
        products p
        ON p.id = o.product_id
      WHERE
        o.complete = false
    `)
      .then((result) => {
        const { rows } = result;
        return response.status(200).send(rows);
      })
      .catch((error) => {
        console.log(error);
        //error while fetching orders
        return;
      });
  })

router.route('/:id/complete')
  .put((request, response) => {
    const { id } = request.params;

    let userId;

    console.log('id: ', id);
    console.log(typeof id);

    return knex.raw(`
      UPDATE
        orders
      SET
        complete = true
      WHERE
        id = :id
      RETURNING
        user_id, product_id
    `, {
        id
      })
      .then((result) => {
        const
          row = result.rows[0],
          productId = row.product_id;

        userId = row.user_id;

        console.log('user_id: ', userId, typeof userId);
        //send user_id.facebook_id a message

        return knex.raw(`
          SELECT
            p.description AS product_description,
            v.description AS vendor_description,
            u.facebook_id
          FROM
            products p
          JOIN
            vendors v
            ON v.id = p.vendor_id
          JOIN
            users u
            ON u.id = :userId
          WHERE
            p.id = :productId
        `, {
            productId,
            userId
          });
      })
      .then((result) => {
        const row = result.rows[0];
        const
          facebookId = row.facebook_id,
          productDescription = row.product_description,
          vendorDescription = row.vendor_description;

        const attachment = `Your ${productDescription} is finished!\n\nPlease pick it up at the ${vendorDescription} booth.`;
        const quickReplies = [new QuickReply('Home', 'Home')];
        const message = new Message(attachment, quickReplies);

        sendMessage(process.env.FMS2019, facebookId, message);
        return response.status(200).send({ success: true });
      })
      .catch((error) => {
        console.log(error);
        return;
      })
  })

module.exports = router;