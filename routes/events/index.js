const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    return knex.raw(`
        SELECT
          events.description,
          icons.url
        FROM
          events
        JOIN
          icons
          ON icons.id = events.icon_id
      `)
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