
exports.up = function(knex) {
  return knex.schema.table('controllers', (table) => {
    table.dropColumn('description');
    table.integer('product_type_id');
    table.foreign('product_type_id').references('id').inTable('product_types');
  });
};

exports.down = function(knex) {
  return knex.schema.table('controllers', (table) => {
    table.dropColumn('product_type_id');
    table.string('description', 256);
  });
};
