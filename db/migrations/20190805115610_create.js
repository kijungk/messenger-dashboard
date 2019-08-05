
exports.up = function(knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments();
    table.integer('event_id');
    table.foreign('event_id').references('id').inTable('events');
    table.integer('product_id');
    table.foreign('product_id').references('id').inTable('products');
    table.boolean('complete').notNullable().defaultTo(false);
    table.timestamps(true, true);
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
