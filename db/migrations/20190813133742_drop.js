
exports.up = function(knex) {
  return knex.schema.dropTable('permissions');
};

exports.down = function(knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.increments();
  });
};
