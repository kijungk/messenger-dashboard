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
      .then((query) => {
        const rows = query.rows;
        console.log('hit');
        return response.status(200).json({ rows });
      })
      .catch((error) => {
        console.log(error);
        // error while fetching all events
      });
  })

module.exports = router;