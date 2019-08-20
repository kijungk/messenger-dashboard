
exports.up = function(knex) {
  return knex.schema.createTable('controllers', (table) => {
    table.increments();
    table.string('description', 256);
    table.boolean('active').notNullable().defaultTo(true);
    table.integer('event_id');
    table.foreign('event_id').references('id').inTable('events');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('controllers');
};
