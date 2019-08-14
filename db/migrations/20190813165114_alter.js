
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.integer('order_status_id').notNullable().defaultTo(1);
    table.foreign('order_status_id').references('id').inTable('order_statuses');
  });
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('order_status_id');
  })
};
