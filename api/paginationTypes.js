const api = require('./instance');
const returnResponseOrError = require('./helpers').returnResponseOrError;


function list() {
  return api
    .get('/pagination-types')
    .then(response => returnResponseOrError(response))
    .catch(e => { throw e; });
}


module.exports = {
  list,
};