
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('order_status_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.integer('order_status_id');
    table.foreign('order_status_id').references('id').inTable('order_statuses').notNullable().defaultTo(1);
  });
};
