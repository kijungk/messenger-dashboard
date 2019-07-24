const
  express = require('express'),
  router = express.Router();

const
  events = require('./events'),
  orders = require('./orders'),
  webhook = require('./webhook');

router.use('/events', events);
router.use('/orders', orders);
router.use('/webhook', webhook);

module.exports = router;