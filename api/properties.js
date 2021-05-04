const { returnResponseOrError } = require('./helpers');
const api = require('./instance');


function create(properties) {
  return api
    .post('/properties/batch', properties)
    .then(response => returnResponseOrError(response))
    .catch(e => { throw e; });
}


module.exports = {
  create,
};