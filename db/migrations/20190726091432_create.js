
exports.up = function(knex) {
  return knex.schema.createTable('administrators', (table) => {
    table.increments();
    table.string('username', 256).notNullable().unique();
    table.string('password', 256).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('administrators');
};
