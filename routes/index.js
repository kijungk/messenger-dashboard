const
  express = require('express'),
  router = express.Router();

const
  broadcasts = require('./broadcasts'),
  events = require('./events'),
  orders = require('./orders'),
  webhook = require('./webhook');

router.use('/broadcasts', broadcasts);
router.use('/events', events);
router.use('/orders', orders);
router.use('/webhook', webhook);

module.exports = router;