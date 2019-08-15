
exports.up = function(knex) {
  return knex.schema.createTable('features', (table) => {
    table.increments();
    table.integer('event_id');
    table.foreign('event_id').references('id').inTable('events');
    table.boolean('active').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('features');
};
