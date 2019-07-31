
exports.up = function(knex) {
  return knex.schema.table('coupons_users', (table) => {
    table.boolean('redeemed').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('coupons_users', (table) => {
    table.dropColumn('redeemed');
  });
};
