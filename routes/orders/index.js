const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex'),
  appEventEmitter = require('../../utilities/eventEmitters');

router.route('/')
  .get((request, response) => {
    let id = 0;

    response.status(200).set({
      'connection': 'keep-alive',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    });

    knex.raw(`
      SELECT
        o.id,
        o.complete,
        e.description,
        p.description
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
        response.write(JSON.stringify(rows));
      })

    appEventEmitter.on('order', (data) => {
      data.stream_id = ++id;
      response.write(JSON.stringify(data));
    });

    function keepAlive() {
      response.write('\n\n');
      setTimeout(keepAlive, 20000);
    }

    setTimeout(keepAlive, 20000);
  })

module.exports = router;