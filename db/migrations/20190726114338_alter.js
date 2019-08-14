
exports.up = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.dropColumn('description');
  });
};

exports.down = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.string('description', 256).notNullable().unique();
  });
};
