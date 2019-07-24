const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    knex('events')
      .join('icons', 'icons.id', '=', 'events.icon_id')
      .select('events.description, icons.url')
      .then((results) => {
        console.log(results);
        return response.status(200).json({ results });
      })
      .catch((error) => {
        console.log(error);
        // error while fetching all events
      });
  })

module.exports = router;