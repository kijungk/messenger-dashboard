
exports.up = function(knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.increments();
    table.string('description', 256).notNullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('permissions');
};
