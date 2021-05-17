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

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1000, height: 1000 }
    });

    try {
      const { source, paginationTypes, scrapingSessionId } = await ApiCalls.fetchInitialRequiredData();
      console.log('required info -> ', {
        source,
        paginationTypes,
        fields: source.SourceFields,
        fieldType: source.SourceFields[0].FieldType,
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

      // for each page, 
      // visit the page, 
      // get the values, 
      // create an obj for the prop
      // place that obj in the scrapedProperties
      const properties = await Promise.all(propertyLinks.slice(1, 4).map(async each => {
        const property = { url: each, };
        let newPage = await browser.newPage();
        await newPage.goto(each, {
          waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
          timeout: 1000 * 60 * 5,
        });

        const initialDetails = await Promise.all(source.SourceFields.map(async each => {
          const { selector, FieldType: fieldType, id } = each;
          let fieldValue = '';

          if (fieldType.label === 'text') {
            fieldValue = await getText(selector, newPage);
          } else if (fieldType.label === 'image') {
            fieldValue = await getImages(selector, newPage);
          }
          console.log('field value -> ', fieldValue);
          return { [id]: fieldValue };
        }));

        const details = initialDetails.reduce((final, each) => {
          const [key] = Object.keys(each);
          return {
            ...final,
            [key]: each[key],
          };
        });
        // we want to get all the field details from the page, and create the obj.
        return { ...property, details, };
      }));
      // in the end, we want to send the ff obj to the back:
      /**
       * {
       * properties: [],
       * sourceId: '',
       * scraperSessionId: '',
       * }
       */
      console.log('properties scraped -> ', JSON.stringify(properties));

      await ApiCalls.createProperties({
        properties,
        sourceId: source.id,
        scraperSessionId: scrapingSessionId,
      });
    } catch (e) {
      // over here, send the error to the backend
      console.log('error -> ', e);
    } finally {
      await browser.close();

    }
  }
)();


async function getText(selector, page) {
  const value = await page
    .evaluate(selector => document.querySelector(selector).textContent, selector)
    .catch(e => { console.log('failed to get selector text -> ', e); });

  return value;
}

async function getImages(selector, page) {
  const value = await page
    .evaluate(
      selector => {
        return document.querySelectorAll(selector);
      },
      selector
    ).then(
      images => console.log('images -> ', images)
    )
    .catch(e => console.log('failed to get images -> ', e));

  return value;
}