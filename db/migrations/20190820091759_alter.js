
exports.up = function(knex) {
  return knex.schema.createTable('controllers', (table) => {
    table.increments();
    table.string('description');
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('controllers');
};
