const
  express = require('express'),
  router = express.Router();

const
  webhook = require('./webhook'),
  orders = require('./orders');

router.use('/webhook', webhook);
router.use('/orders', orders);

module.exports = router;