const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

const
  Message = require('../../utilities/models/Message'),
  QuickReply = require('../../utilities/models/QuickReply'),
  { sendMessage } = require('../../utilities/handlers/sendHandler');

function decreaseInventory(knex, eventDescription, productDescription) {
  return knex.raw(`
      UPDATE
        products
      SET
        inventory = inventory - 1
      FROM
        vendors,
        events
      WHERE
        vendors.id = products.vendor_id
      AND events.id = vendors.event_id
      AND events.description = :eventDescription
      AND products.description = :productDescription
    `, {
      eventDescription,
      productDescription
    });
}

router.route('/')
  .get((request, response) => {
    console.log('Orders Interval 5000');
    return knex.raw(`
      SELECT
        o.id,
        o.created_at,
        o.order_status_id,
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
  });

router.route('/vendors/:vendorId')
  .get((request, response) => {
    const { vendorId } = request.params;

    return knex.raw(`
      SELECT
        o.id,
        o.created_at,
        o.order_status_id,
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
      JOIN
        vendors v
        ON v.id = p.vendor_id
        AND v.id = :vendorId
    `, {
        vendorId
      })
      .then((result) => {
        const { rows } = result;
        return response.status(200).send(rows);
      })
      .catch((error) => {
        console.log(error);
        //error while fetching orders
        return;
      });
  });

router.route('/:id')
  .put((request, response) => {
    const
      { id } = request.params,
      { orderStatusId } = request.body;

    let
      userId,
      attachment,
      facebookId;

    return knex.raw(`
      UPDATE
        orders
      SET
        order_status_id = :orderStatusId
      WHERE
        id = :id
      RETURNING
        user_id, product_id
    `, {
        id,
        orderStatusId
      })
      .then((result) => {
        const
          row = result.rows[0],
          productId = row.product_id;

        userId = row.user_id;

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
          productDescription = row.product_description,
          vendorDescription = row.vendor_description;

        facebookId = row.facebook_id;

        if (orderStatusId == 2) {
          attachment = `Your ${productDescription} is being made!\n\nPlease wait a few more minutes for it to be completed.`;
          return decreaseInventory(knex, 'FMS 2019', row.product_description);
        }

        if (orderStatusId == 3) {
          return attachment = `Your ${productDescription} is finished!\n\nPlease pick it up at the ${vendorDescription} booth.`;
        }
      })
      .then(() => {
        const quickReplies = [new QuickReply('Home', 'Home')];
        const message = new Message(attachment, quickReplies);

        sendMessage(process.env.FMS2019, facebookId, message);
        return response.status(200).send({ success: true });
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  });

module.exports = router;