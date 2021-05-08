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
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
      });

      let propertyLinks = [];

      // use pagination to go to the right page
      if (source.paginationType === paginationTypes.CLICK) {
        // click on the next page link lastScrapedPage + 1 times to go to the right page
        // we'll have to wait after each click, for the next page to load.
        console.log("pagination type is click");
        const pageToScrape = source.lastScrapedPage;

        for (let i = 0;i < pageToScrape;i++) {
          await page.focus(source.clickPaginationSelector);
          await page.evaluate(() => {
            document.querySelector('#pagenumnext').click();
          });

        }
        propertyLinks = await page.evaluate(
          (source) => [...document.querySelectorAll(source.singlePropertyQuerySelector)]
            .map(each => each.href), source);

      } else if (source.paginationType === paginationTypes.INFINITE) {

        // determine how many are on a page, by checking the number of properties in the dom. let's call this number 'y'.
        const numPropertiesOnPage = await page.evaluate(({ source }) => {
          return document.querySelectorAll(source.singlePropertyQuerySelector).length;
        }, { source });

        console.log('number of properties per page -> ', numPropertiesOnPage);

        const pageToScrape = source.lastScrapedPage;

        // scroll the page x number of times
        //    for each scroll, wait for the page content to load

        for (let i = 0;i < pageToScrape;i++) {
          let previousHeight = document.body.scrollHeight;
          await page.evaluate(() => {
            window.scrollTo(0, window.document.body.scrollHeight);
          });
          await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
          await page.waitFor(1000);
        }

        // then fetch the properties from the dom. because it's infinite scrolling, from page 1 to page x might be on there.
        // so we take the 'y' number of items from the back of the array, and use those for the scraping
        propertyLinks = await page.evaluate(({ source, numPropertiesOnPage }) => {
          const allItems = [...document.querySelectorAll(source.singlePropertyQuerySelector)].map(each => each.href);
          return allItems.slice(Math.max(allItems - numPropertiesOnPage, 1));
        }, { source, numPropertiesOnPage });
      }


      // from here, we're on the right page. we can start taking the field details for each of the properties, and package them for delivery to the backend.
      console.log('extracted property links -> ', propertyLinks);
      const scrapedProperties = {};

      // for each page, 
      // visit the page, 
      // get the values, 
      // create an obj for the prop
      // place that obj in the scrapedProperties
      propertyLinks.forEach(each => {
        
      })

      // await browser.close();
    } catch (e) {
      // over here, send the error to the backend
      console.log('error -> ', e);
    }
  })();

