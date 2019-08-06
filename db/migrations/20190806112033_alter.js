
exports.up = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.dropColumn('coupon_type_id');
    table.integer('product_type_id');
    table.foreign('product_type_id').references('id').inTable('product_types');
  })
};

exports.down = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.dropColumn('product_type_id');
  })
};
