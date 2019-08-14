
exports.up = function(knex) {
  return knex.schema.table('administrators', (table) => {
    table.integer('permission_id');
    table.foreign('permission_id').references('id').inTable('permissions');
  });
};

exports.down = function(knex) {
  return knex.schema.table('administrators', (table) => {
    table.dropColumn('permission_id');
  })
};
