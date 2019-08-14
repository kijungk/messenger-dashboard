
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.integer('coupon_user_id');
    table.foreign('coupon_user_id').references('id').inTable('coupons_users');
  });
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('coupon_user_id');
  });
};
