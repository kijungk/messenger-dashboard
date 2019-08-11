const
  express = require('express'),
  router = express.Router(),
  knex = require('../../db/knex'),
  passport = require('passport'),
  bcrypt = require('bcrypt'),
  saltedRounds = 12;

const isAuthenticated = require('../../utilities/auth/authentication');

router.route('/')
  .post((request, response) => {
    console.log('hit');
    const { username, password } = request.body;

    const newUser = {
      username,
      hashedPassword: ''
    }

    return bcrypt
      .genSalt(saltedRounds)
      .then((salt) => {
        return bcrypt.hash(password, salt);
      })
      .then((hash) => {
        newUser.hashedPassword = hash;
        return knex.raw(`
          INSERT INTO
            administrators (username, password)
          VALUES
            (:username, :hashedPassword)
        `, newUser);
      })
      .then((result) => {
        console.log(result);
        return;
      })
      .catch((error) => {
        console.log(error);
        return;
      })


  })

router.route('/login')
  .post(passport.authenticate('local'), (request, response) => {
    console.log(request);
  });

module.exports = router;