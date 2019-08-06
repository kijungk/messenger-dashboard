
exports.up = function(knex) {
  return knex.schema.table('products', (table) => {
    table.dropColumn('coupon_id');
    table.integer('product_type_id');
    table.foreign('product_type_id').references('id').inTable('product_types');
  });
};

exports.down = function(knex) {
  return knex.schema.table('products', (table) => {
    table.integer('coupon_id')
    table.foreign('coupon_id').references('id').inTable('coupons');
    table.dropColumn('product_type_id');
  });
};