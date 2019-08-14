module.exports = (function constants() {
  const httpStatusCodes = {
    ok: 200,
    badRequest: 400,
    forbidden: 403,
    notFound: 404
  };

  const entryIds = {
    FMS2019: '2248986022080033',
    CXO2019: '636910476828386'
  };

  const entryIdLabels = {
    '2248986022080033': '2923778247694414',
    '636910476828386': '2609710575715602'
  }

  return {
    entryIds: entryIds,
    httpStatusCodes: httpStatusCodes,
    entryIdLabels: entryIdLabels
  }
})();