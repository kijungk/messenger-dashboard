
exports.up = function(knex) {
  return knex.schema.table('permissions', (table) => {
    table.integer('vendor_id');
    table.foreign('vendor_id').references('id').inTable('vendors');
  });
};

exports.down = function(knex) {
  return knex.schema.table('permissions', (table) => {
    table.dropColumn('vendor_id');
  });
};
