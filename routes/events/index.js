const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    return knex.raw(`
        SELECT
          events.id,
          events.description,
          icons.url
        FROM
          events
        JOIN
          icons
          ON icons.id = events.icon_id
      `)
      .then((result) => {
        const { rows } = result;
        return response.status(200).send(rows);
      })
      .catch((error) => {
        console.log(error);
        // error while fetching all events
      });
  });

router.route('/:id')
  .get((request, response) => {
    const { id } = request.params;

    return knex.raw(`
      SELECT
        events.id,
        events.description,
        icons.url
      FROM
        events
      JOIN
        icons
        ON icons.id = events.icon_id
      WHERE
        events.id = ?
    `, [id])
      .then((result) => {
        const { rows } = result;
        const row = rows[0];

        return response.status(200).send(row);
      })
  })

module.exports = router;