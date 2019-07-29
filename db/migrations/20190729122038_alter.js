
exports.up = function(knex) {
  return knex.schema.table('products', (table) => {
    table.integer('coupon_id');
    table.foreign('coupon_id').references('id').inTable('coupons');
  });
};

exports.down = function(knex) {
  return knex.schema.dropColumn('coupon_id');
};
