const
  bodyParser = require('body-parser'),
  express = require('express'),
  routes = require('./routes'),
  app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const forceSSL = function () {
  return function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(
        ['https://', req.get('Host'), req.url].join('')
      );
    }
    next();
  }
}

app.use(forceSSL());

// app.use(express.static(__dirname + '/dist/facebook-frontend'));

app.use('/api', routes);

// app.get('*', (request, response) => {
//   response.sendFile(__dirname + '/dist/facebook-frontend/index.html', (err) => {
//     if (err) {
//       response.status(500).json(err);
//     }
//   })
// })

module.exports = app;