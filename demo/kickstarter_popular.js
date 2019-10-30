const request = require('request-promise')
const crawl = require('../index')

const setting = {
  pageNotFound: [{
    elem: '.grey-frame-inner h1',
    get:  'text',
    check: ['equal', '404']
  }],
  type: 'list',
  container: '#projects_list .project-card',
  // listOption: [ 'limit', 3 ],
  listOption: [ 'range', 0, 10 ],
  // listOption: [ 'ignore', 0, 2, -1 ],
  // listOption: [ 'focus', 3, -3 ],
  crawl: {
    projectID: {
      get: 'data-pid',
    },
    name: {
      elem: '.project-title',
      get:  'text',
    },
    image: {
      elem: '.project-thumbnail img',
      get:  'src'
    },
    link: {
      elem: '.project-title a',
      get:  'href',
      process: [
        [ 'split', '?', 0 ],
        [ 'prepend', 'https://www.kickstarter.com' ]
      ]
    },
    description: {
      elem: '.project-blurb',
      get:  'text'
    },
    funded: {
      elem: '.project-stats-value:eq(0)',
      get:  'text'
    },
    percentPledged: {
      elem: '.project-percent-pledged',
      get:  'style',
      process: [
        [ 'split', /:\s?/g, 1 ]
      ]
    },
    pledged: {
      elem: '.money.usd',
      get:  'num'
    }
  }
}

const url = 'https://www.kickstarter.com/discover/popular?ref=popular'
console.info('Crawl the popular list at Kickstarter.')

;(async function () {
  try {
    console.info(`Request: ${url}\n`)
    const content = await request(url)
    const result = content ? await crawl(content, setting) : 'No content'

    console.log('Result:', result)
    console.log('Total:', result.length)
  } catch (err) { console.error(err) }
})()
