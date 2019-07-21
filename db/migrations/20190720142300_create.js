
exports.up = function(knex) {
  return knex.schema.createTable('icons', (table) => {
    table.increments();
    table.string('description', 256).notNullable().unique();
    table.string('url', 1024).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('icons');
};
