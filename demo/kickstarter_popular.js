const puppeteer = require('puppeteer');
const crawl = require('../index')

const setting = {
  pageNotFound: [{
    elem: '.grey-frame-inner h1',
    get:  'text',
    check: ['equal', '404']
  }],
  type: 'list',
  container: '#projects .js-track-project-card',
  // listOption: ['limit', 3],
  listOption: ['range', 0, 10],
  // listOption: ['ignore', 0, 2, -1],
  // listOption: ['focus', 3, -3],
  crawl: {
    projectID: {
      get: 'data-project_pid',
    },
    name: {
      elem: 'h3',
      get: 'text',
    },
    image: {
      elem: '.self-start img',
      get: 'src'
    },
    link: {
      elem: '.self-start a',
      get: 'href',
      process: [
        ['split', '?', 0],
      ]
    },
    description: {
      get: 'data-project_description'
    },
    pledged: {
      elem: '[data-test-id="amount-pledged"]',
      get: 'text'
    },
    percentPledged: {
      elem: '[data-test-id="percent-raised"] > span:first-child',
      get: 'text'
    },
    type: {
      elem: '[data-test-id="time-left"] + div a:first-child',
      get: 'text'
    },
    place: {
      elem: '[data-test-id="time-left"] + div a:last-child',
      get: 'text'
    },
  }
}

const url = 'https://www.kickstarter.com/discover/popular'
console.info('Crawl the popular list at Kickstarter.')

;(async function () {
  try {
    console.info(`Request: ${url}\n`)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36')
    await page.goto(url)
    const bodyHTML = await page.content()
    const result = bodyHTML ? await crawl(bodyHTML, setting) : 'No content'

    console.log('Result:', result)
    console.log('Total:', result.length)
    await browser.close()
  } catch (err) { console.error(err) }
})()
