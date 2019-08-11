
exports.up = function(knex) {
  return knex.schema.table('permissions', (table) => {
    table.string('description').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('permissions', (table) => {
    table.dropColumn('description');
  });
};
