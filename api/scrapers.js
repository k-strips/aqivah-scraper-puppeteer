const api = require('./instance');
const returnResponseOrError = require('./helpers').returnResponseOrError;

const SCRAPER_TYPES = {
  NEW: 'NEW',
  UPDATE: 'UPDATE',
};

const changeStatus = (id, status) => {
  return api
    .patch(`/scrapers/${id}`, { status })
    .then(returnResponseOrError)
    .catch(e => { throw e; });
};

function initializeSession({ sourceId, scraper = SCRAPER_TYPES.NEW }) {
  console.log('source id -> ', sourceId)
  if (!sourceId) {
    throw new Error('Source id is required for creating a scraping session');
  };
  return api
    .post(`/scraper-sessions`, { scraper, sourceId })
    .then(returnResponseOrError)
    .catch(e => {
      console.log('couldnt initialize scraping session -> ', e);
      throw e;
    });
}

// function storeError(error)

// exports.SCRAPER_TYPES = SCRAPER_TYPES;
// exports.changeStatus = changeStatus;
// exports.initializeSession = initializeSession;

module.exports = {
  SCRAPER_TYPES,
  changeStatus,
  initializeSession,
};