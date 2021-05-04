const ApiCalls = require('./utilFunctions');
const puppeteer = require('puppeteer');
/**
 * flow:
 * fetch the data we need from the backend
 *  - the next source to scrape
 *  - visit the list page, with pagination (either paged or infinite)
 *  - get the urls to the all properties on the list page
 *  - visit these properties one by one, scrape the property details, add details to values, and close tab
 *  - if error occurs at any point in time, catch it, send to the backend, and exit
 *  - upon successfully getting all the details, send the values to the backend.
 * 
 */

(
  async function () {
    try {
      const { source, paginationTypes } = await ApiCalls.fetchInitialRequiredData();
      console.log('required info -> ', { source, paginationTypes });

      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1000, height: 1000 }
      });
      const page = await browser.newPage();
      await page.goto(source.url, {
        waitUntil: 'networkidle2',
      });

      // use pagination to go to the right page
      if (source.paginationType === paginationTypes.CLICK) {
        // click on the next page link lastScrapedPage + 1 times to go to the right page
        // we'll have to wait after each click, for the next page to load.
        console.log("pagination type is click");
        const numTimesToScrape = source.lastScrapedPage;

        await Promise.all([
          page.waitForNavigation({ timeout: 1000 * 30, waitUntil: 'networkidle2' }),
          page.click(source.clickPaginationSelector, { clickCount: 2 })
        ]);
        console.log('clicked');


      } else if (source.paginationType === paginationTypes.INFINITE) {
        // scroll the page x number of times
        //    for each scroll, wait for the page content to load
      }

      // await browser.close();
    } catch (e) {
      // over here, send the error to the backend
      console.log('error -> ', e);
    }
  })();

