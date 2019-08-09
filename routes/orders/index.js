const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex'),
  appEventEmitter = require('../../utilities/eventEmitters');

function orderHandler(response) {
  return function(data) {
    if (!response.finished) {
      response.write('event:message\n');
      response.write(`data: ${data}\n\n`);
      console.log('hit');
    }
    return;
  }
}

router.route('/')
  .get((request, response) => {
    console.log('check for request');
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

module.exports = router;