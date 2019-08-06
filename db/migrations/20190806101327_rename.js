
exports.up = function(knex) {
  return knex.schema.renameTable('coupon_types', 'product_types');
};

exports.down = function(knex) {
  return knex.schema.renameTable('product_types', 'coupon_types');
};
