
exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments();
    table.string('description', 256).notNullable();
    table.integer('inventory');
    table.integer('vendor_id');
    table.foreign('vendor_id').references('id').inTable('vendors');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
