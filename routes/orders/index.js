const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex'),
  appEventEmitter = require('../../utilities/eventEmitters');

router.route('/')
  .get((request, response) => {
    response.status(200).set({
      'connection': 'keep-alive',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    });

    knex.raw(`
      SELECT
        o.id,
        o.created_at,
        p.description,
        v.id
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
      WHERE
        o.complete = false
    `)
      .then((result) => {
        const { rows } = result;
        response.write(JSON.stringify(rows));
      })
      .catch((error) => {
        console.log(error);
        //error while fetching orders
        return;
      });

    appEventEmitter.on('order', (data) => {
      return knex.raw(`
        SELECT
          o.id,
          o.created_at,
          p.description,
          v.id
        FROM
          orders o
        JOIN
          products p
          ON p.id = o.product_id
        JOIN
          vendors v
          ON v.id = p.vendor_id
        WHERE
          o.id = :id
      `, {
          id: data.id
        })
        .then((result) => {
          const row = result.rows[0];

          response.write(JSON.stringify(row));
        })
        .catch((error) => {
          console.log(error);
          //error while fetching order;
          return;
        });
    });

    function keepAlive() {
      response.write('\n\n');
      setTimeout(keepAlive, 20000);
    }

    setTimeout(keepAlive, 20000);
  })

module.exports = router;