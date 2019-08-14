
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('complete');
    table.integer('order_status_id');
    table.foreign('order_status_id').references('id').inTable('order_statuses');
  })
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.boolean('complete');
    table.dropColumn('order_status_id');
  })
};
