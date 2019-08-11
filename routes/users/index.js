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
      .then(() => {
        return response.status(200).json({ success: true });
      })
      .catch((error) => {
        console.log(error);
        return response.sendStatus(500);
      })


  })

router.route('/login')
  .post(passport.authenticate('local'), (request, response) => {
    const { user } = request;

    return response.status(200).send({
      id: user.id,
      username: user.username
    });
  });

module.exports = router;