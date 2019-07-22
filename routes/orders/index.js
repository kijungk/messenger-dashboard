const
  express = require('express'),
  router = express.Router(),
  appEventEmitter = require('../../utilities/eventEmitters');

router.route('/')
  .get((request, response) => {
    let id = 0;

    response.status(200).set({
      'connection': 'keep-alive',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
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