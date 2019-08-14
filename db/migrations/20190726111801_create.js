
exports.up = function(knex) {
  return knex.schema.createTable('coupons', (table) => {
    table.increments();
    table.string('description', 256).notNullable().unique();
    table.integer('event_id');
    table.foreign('event_id').references('id').inTable('events');
    table.integer('coupon_type_id');
    table.foreign('coupon_type_id').references('id').inTable('coupon_types');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coupons');
};
