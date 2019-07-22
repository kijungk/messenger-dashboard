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
      response.write(data);
    })
  })

module.exports = router;