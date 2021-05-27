const SourcesApi = require('./api/sources');
const ScrapersApi = require('./api/scrapers');
const PaginationApi = require('./api/paginationTypes');
const PropertiesApi = require('./api/properties');

// console.log('value of getnextsourcetoscrape -> ', getNextSourceToScrape);

const celebrate = '🎉';
const error = '⛔️';
const loading = '🤞🏾';

const fetchNextSource = async () => {
  try {
    console.log(`*** ${loading} fetching next source to scrape...`);
    const response = await SourcesApi.getNextSourceToScrape();
    console.log('retrieved next source to scrape -> ', response);
    return response;
  } catch (e) {
    console.log('failed to fetch next source to scrape -> ', e.data);
    //have a function that logs the error,  terminates the lambda and returns?
  }
};


const logActiveStatus = async () => {
  try {
    console.log('*** scraper is currently active. logging status to database ****');
    const response = await ScrapersApi.changeStatus(1, 'active');
    console.log('*** scraper set to active 🎉');
  } catch (e) {
    console.log('failed to fetch next source to scrape -> ', e);
    //have a function that logs the error,  terminates the lambda and returns?
  }
};

const fetchPaginationTypes = async () => {
  try {
    const response = await PaginationApi.list();
    console.log('fetched pagination types => ', response);
    return response;
  } catch (e) {
    console.log('*** failed to fetch pagination types -> ', e);
    //log the error, and exit.
  }
};


const fetchInitialRequiredData = async () => {
  try {
    console.log('*** fetching required data for scraping ');
    //fetch the next source to scrape
    //fetch the pagination types

    const source = await fetchNextSource();
    const scrapingSessionId = await initializeScrapingSession(source.id);
    return {
      source,
      scrapingSessionId,
      paginationTypes: { CLICK: 'CLICK', INFINITE: 'INFINITE', },
    };
  } catch (e) {
    console.log('failed to fetch initial required data -> ', e.data);
    //log the error and exit.
  }
};


const goToPage = async ({ paginationTypeOptions, paginationType, page, pageNumber }) => {
  if (paginationTypeOptions === 'PAGED') {
    //click on the button that will take the browser to the page. 
    //or get the href from it, and navigate there.
  }


  if (paginationType === 'INFINITE') {
    //return a promise that scrolls by the current window height.
  }
};


const createProperties = async properties => {
  try {
    console.log('\n*** attempting to submit properties to api');
    console.log('\n sending values -> ', properties);
    // object sent to the api should be of the following form:
    /**
     * {
      * properties: [
      *  {id}: {fieldId: value, fieldId2: value2, fieldId3, value3}
      * ]
      * scraperSessionId,
      * sourceId,
     * }
     * 
     */
    const response = await PropertiesApi.create(properties);
    console.log('*** 🎉 successfully submitted properites');
    return response;
  } catch (e) {
    console.log();
  }
};

const initializeScrapingSession = async (sourceId) => {
  try {
    console.log('\n*** initializing scraping session ***');
    const response = await ScrapersApi.initializeSession({ sourceId });
    console.log(`\n*** ${celebrate} successfully initialized scraping session ${JSON.stringify(response)}`);
    return response.id;
  } catch (e) {
    console.log(`${error} failed to initialize scraping session. -> `, e);
    return ({ success: false, message: 'Failed to initialize scraping session', error: e });
  }
};

const storeError = async ({ error, scrapingSessionId }) => {
  try {
    console.log(`\n sending scraping session failure error to backend`);
    const response = await ScrapersApi.storeError({ error, id: scrapingSessionId });
    console.log(`\n*** ${celebrate} successfully stored failure of scraping session ***`);
    return response;
  } catch (error) {
    console.log(`${error} failed to store failure of scraping session ***`);
    return ({ success: false, message: 'failed to store failure of scraping session' });
  }
};


module.exports = {
  fetchNextSource,
  logActiveStatus,
  fetchPaginationTypes,
  fetchInitialRequiredData,
  goToPage,
  createProperties,
  initializeScrapingSession,
  storeError,
  celebrate,
  error,
  loading,
};