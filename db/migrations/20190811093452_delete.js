
exports.up = function(knex) {
  return knex.schema.dropTable('administrators_permissions');
};

exports.down = function(knex) {
  return knex.schema.createTable('administrators_permissions', (table) => {
    table.increments();
  });
};
