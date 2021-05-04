const api = require('./instance');
const returnResponseOrError = require('./helpers').returnResponseOrError;

const getNextSourceToScrape = () => {
  return api
    .get('/sources/next')
    .then(response => returnResponseOrError(response))
    .catch(e => { throw e; });
};

module.exports = {
  getNextSourceToScrape,

};
