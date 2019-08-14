
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.integer('user_id');
    table.foreign('user_id').references('id').inTable('users');
  })
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('user_id');
  })
};
