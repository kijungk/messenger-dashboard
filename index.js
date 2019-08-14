const
  http = require('http'),
  app = require('./server'),
  PORT = process.env.PORT || 8008,
  server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Application is now listening on port: ${PORT}\n`);
});