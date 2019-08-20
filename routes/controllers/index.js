const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    return knex.raw(`
      SELECT
        c.id,
        c.description,
        c.active
      FROM
        controllers c
      JOIN
        events e
        ON e.id = c.event_id
        AND e.description = 'FMS 2019'
      ORDER BY
        c.id
    `)
      .then((result) => {
        const { rows } = result;
        console.log(rows);

        return response.status(200).send(rows);
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  });

router.route('/:id')
  .put((request, response) => {

  })

module.exports = router;