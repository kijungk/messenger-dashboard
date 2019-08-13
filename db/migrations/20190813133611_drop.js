
exports.up = function(knex) {
  return knex.schema.dropTable('administrators');
};

exports.down = function(knex) {
  return knex.schema.createTable('administrators', (table) => {
    table.increments();
  });
};
