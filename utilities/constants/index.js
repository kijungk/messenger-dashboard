module.exports = (function constants() {
  const httpStatusCodes = {
    ok: 200,
    badRequest: 400,
    forbidden: 403,
    notFound: 404
  };

  return {
    httpStatusCodes: httpStatusCodes
  }
})();