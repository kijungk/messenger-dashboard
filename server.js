const
  bodyParser = require('body-parser'),
  express = require('express'),
  routes = require('./routes'),
  app = express();

const
  knex = require('./db/knex'),
  passport = require('passport'),
  session = require('express-session'),
  client = require('redis').createClient(process.env.REDIS_URL),
  RedisStore = require('connect-redis')(session),
  LocalStrategy = require('passport-local'),
  bcrypt = require('bcrypt');

app.use(session({
  store: new RedisStore({
    client
  }),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  credentials: 'include'
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
  console.log(administrator);
  return knex.raw(`
    SELECT
      *
    FROM
      administrators
    WHERE
      username = :username
  `, {
      username: administrator.username
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
      a.username,
      a.password,
      p.description,
      p.vendor_id
    FROM
      administrators a
    JOIN
      permissions p
      ON p.id = a.permission_id
    WHERE
      a.username = :username
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