const
  express = require('express'),
  router = express.Router();

const
  broadcasts = require('./broadcasts'),
  events = require('./events'),
  orders = require('./orders'),
  products = require('./products'),
  webhook = require('./webhook');

router.use('/broadcasts', broadcasts);
router.use('/events', events);
router.use('/orders', orders);
router.use('/products', products);
router.use('/webhook', webhook);

module.exports = router;