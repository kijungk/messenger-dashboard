const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex');

router.route('/')
  .get((request, response) => {
    const { vendorId, productTypeId } = request.query;

    return knex.raw(`
      SELECT
        p.id,
        p.description,
        p.inventory
      FROM
        products p
      JOIN
        vendors v
        ON v.id = p.vendor_id
        AND v.id = :vendorId
      JOIN
        events e
        ON e.id = v.event_id
        AND e.description = 'FMS 2019'
      JOIN
        product_types pt
        ON pt.id = p.product_type_id
        AND pt.id = :productTypeId
    `, {
        productTypeId,
        vendorId
      })
      .then((result) => {
        const { rows } = result;

        return response.status(200).send(rows);
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  });

router.route('/:id')
  .put((request, response) => {
    const
      { id } = request.params,
      { inventory } = request.body;

    return knex.raw(`
      UPDATE
        products
      SET
        inventory = :inventory
      WHERE
        id = :id
    `, {
        id,
        inventory
      })
      .then(() => {

        return response.status(200).send({ success: true });
      })
      .catch((error) => {
        console.log(error);
        return;
      });
  });
module.exports = router;