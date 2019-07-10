const
  express = require('express'),
  router = express.Router();

const
  webhook = require('./webhook');

router.use('/webhook', webhook);

module.exports = router;