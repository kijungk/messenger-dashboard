const
  bodyParser = require('body-parser'),
  express = require('express'),
  routes = require('./routes'),
  app = express();

const
  passport = require('passport'),
  session = require('passport-session'),
  RedisStore = require('connect-redis')(session),
  LocalStrategy = require('passport-local'),
  bcrypt = require('bcrypt');

app.use(session({
  store: new RedisStore(),
  secret: process.env.REDIS_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((administrator, done) => {
  return done(null, {
    id: administrator.id,
    username: administrator.username,
    role: administrator.role
  });
});

passport.deserializeUser((administrator, done) => {
  return knex.raw(`
    SELECT
      *
    FROM
      administrators
    WHERE
      id = :administratorId
  `, {
      administratorId: administrator.id
    })
    .then((result) => {
      const administrator = result.rows[0];

      return done(null, {
        id: administrator.id,
        username: administrator.username,
        role: administrator.role
      });
    })
    .catch((error) => {
      console.log(error);
      return done(error);
    });
});

passport.use(new LocalStrategy((username, password, done) => {
  return knex.raw(`
    SELECT
      *
    FROM
      administrators
    WHERE
      username = :username
  `, {
      username
    })
    .then((result) => {
      const administrator = result.rows[0];

      if (!administrator) {
        return done(null, false, { message: 'Incorrect username' });
      }

      if (administrator) {
        return bcrypt.compare(password, administrator.password)
          .then((result) => {
            if (result) {
              return done(null, administrator);
            }

            return done(null, false, { message: 'Incorrect password' });
          })
          .catch((error) => {
            console.log(error);
            return;
          })
      }
    })
    .catch((error) => {
      console.log(error);
      return;
    });
}));




app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const forceSSL = function() {
  return function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(
        ['https://', req.get('Host'), req.url].join('')
      );
    }
    next();
  }
}

app.use(forceSSL());

app.use(express.static(__dirname + '/dist/messenger-dashboard-frontend'));

app.use('/api', routes);

app.get('*', (request, response) => {
  response.sendFile(__dirname + '/dist/messenger-dashboard-frontend/index.html', (err) => {
    if (err) {
      response.status(500).json(err);
    }
  })
})

module.exports = app;