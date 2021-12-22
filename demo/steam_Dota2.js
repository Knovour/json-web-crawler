const axios = require('axios')
const crawl = require('../index')

const setting = {
  type: 'content',
  container: '#game_highlights .rightcol',
  crawl: {
    appId: {
      elem: '.glance_tags',
      get:  'data-appid'
    },
    appName: {
      outOfContainer: true,
      elem: '#appHubAppName',
      get:  'text'
    },
    image: {
      elem: '.game_header_image_full',
      get:  'src'
    },
    reviews: {
      elem: '.game_review_summary:eq(0)',
      get:  'text',
    },
    tags: {
      elem: '.glance_tags',
      collect: {
        elems: [{
          elem: 'a.app_tag:eq(0)',
          get:  'text'
        }, {
          elem: 'a.app_tag:eq(1)',
          get:  'text'
        }, {
          elem: 'a.app_tag:eq(2)',
          get:  'text'
        }],
        combineWith: ', '
      }
    },
    allTags: {
      elem: '.glance_tags a.app_tag',
      collect: {
        loop: true,
        get:  'text',
        combineWith: ', '
      }
    },
    description: {
      elem: '.game_description_snippet',
      get:  'text',
      process(value) {
        return value.split(', ')
      }
    },
    releaseDate: {
      elem: '.release_date .date',
      get:  'text'
    }
  }
}

const url = 'http://store.steampowered.com/app/570/'
console.info('Crawl Dota 2 description at Steam site.')

;(async function () {
  try {
    console.info(`Request: ${url}\n`)
    const res = await axios.get(url)
    const result = res.data ? await crawl(res.data, setting) : 'No content'

    console.log('Result:', result)
  } catch (err) { console.error(err) }
})()
