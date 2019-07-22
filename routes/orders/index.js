const
  express = require('express'),
  router = express.Router();

router.route('/')
  .get((request, response) => {
    let id = 0;

    response.status(200).set({
      'connection': 'keep-alive',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    })

    response.app.on('order', (data) => {
      data.stream_id = ++id;
      console.log(data);
      response.write(data);
    })

    function keepAlive() {
      console.log('keeping it alive...');
      response.write({});
      setTimeout(keepAlive, 20000);
    }

    setTimeout(keepAlive, 20000);
  })

module.exports = router;