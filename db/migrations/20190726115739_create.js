
exports.up = function(knex) {
  return knex.schema.createTable('coupons_users', (table) => {
    table.increments();
    table.integer('coupon_id');
    table.foreign('coupon_id').references('id').inTable('coupons');
    table.integer('user_id');
    table.foreign('user_id').references('id').inTable('users');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupons_users');
};
