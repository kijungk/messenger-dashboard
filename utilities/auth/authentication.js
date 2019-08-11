module.exports = function(request, response, next) {
  if (!request.isAuthenticated()) {
    return response.sendStatus(401);
  }

  return next();
}