
exports.up = function(knex) {
  return knex.schema.createTable('booths_users', (table) => {
    table.increments();
    table.integer('booth_id');
    table.foreign('booth_id').references('id').inTable('booths');
    table.integer('user_id');
    table.foreign('user_id').references('id').inTable('users');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('booths_users');
};
