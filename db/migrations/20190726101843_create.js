
exports.up = function(knex) {
  return knex.schema.createTable('administrators_permissions', (table) => {
    table.increments();
    table.integer('administrator_id');
    table.foreign('administrator_id').references('id').inTable('administrators');
    table.integer('permission_id');
    table.foreign('permission_id').references('id').inTable('permissions');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('administrators_permissions');
};
