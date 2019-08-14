
exports.up = function(knex) {
  return knex.schema.createTable('coupon_types', (table) => {
    table.increments();
    table.string('description', 256).notNullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupon_types');
};
