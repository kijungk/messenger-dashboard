const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex'),
  appEventEmitter = require('../../utilities/eventEmitters');

function orderHandler(response) {
  return function(data) {
    response.write('event:message\n');
    response.write(`data: ${data}\n\n`);
    console.log('hit');
    return;
  }
}

router.route('/')
  .get((request, response) => {
    console.log('lets check for request');

    request.socket.on('close', () => {
      console.log('close');
      appEventEmitter.removeListener('order', orderHandler);
    });


    response.set({
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    });

    appEventEmitter.on('order', orderHandler(response));


    // response.status(200).set({
    //   'connection': 'keep-alive',
    //   'cache-control': 'no-cache',
    //   'content-type': 'text/event-stream'
    // });

    // knex.raw(`
    //   SELECT
    //     o.id,
    //     o.created_at,
    //     p.description,
    //     p.vendor_id
    //   FROM
    //     orders o
    //   JOIN
    //     events e
    //     ON e.id = o.event_id
    //     AND e.description = 'FMS 2019'
    //   JOIN
    //     products p
    //     ON p.id = o.product_id
    //   WHERE
    //     o.complete = false
    // `)
    //   .then((result) => {
    //     const { rows } = result;
    //     console.log('request is in, trying to send back rows');

    //     response.write('fuck you');
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     //error while fetching orders
    //     return;
    //   });

    // appEventEmitter.on('order', (data) => {
    //   return knex.raw(`
    //     SELECT
    //       o.id,
    //       o.created_at,
    //       p.description,
    //       p.vendor_id
    //     FROM
    //       orders o
    //     JOIN
    //       products p
    //       ON p.id = o.product_id
    //     WHERE
    //       o.id = :id
    //   `, {
    //       id: data.id
    //     })
    //     .then((result) => {
    //       const row = result.rows[0];
    //       response.write(JSON.stringify(row));
    //     })
    //     .catch((error) => {
    //       console.log(error);
    //       //error while fetching order;
    //       return;
    //     });
    // });

    // function keepAlive() {
    //   response.write('\n\n');
    //   setTimeout(keepAlive, 20000);
    // }

    // setTimeout(keepAlive, 20000);
  })

router.route('/test')
  .get((request, response) => {
    appEventEmitter.emit('order', 'hello');
    return response.end();
  })
module.exports = router;