
exports.up = function(knex) {
  return knex.schema.table('features', (table) => {
    table.string('description').notNullable().unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('features', (table) => {
    table.dropColumn('description');
  })
};
