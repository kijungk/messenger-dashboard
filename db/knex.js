const environment = process.env.ENVIRONMENT || 'production';
const config = require('../knexfile')[environment];
const knex = require('knex')(config);

module.exports = knex;