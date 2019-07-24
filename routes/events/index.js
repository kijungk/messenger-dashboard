const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    return knex.select().from('events')
      .then((results) => {
        console.log(results);
        return response.status(200).json({ results });
      })
      .catch((error) => {
        // error while fetching all events
      });
  })

module.exports = router;