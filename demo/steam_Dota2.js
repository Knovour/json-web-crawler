console.info('Crawl Dota 2 description at Steam site. \n');

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
      elem: '.apphub_AppName',
      get:  'text'
    },
    image: {
      elem: '.game_header_image_full',
      get:  'src'
    },
    reviews: {
      elem: '.game_review_summary',
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
        return value.split(', ');
      }
    },
    releaseDate: {
      elem: '.release_date .date',
      get:  'text'
    }
  }
};

const url = 'http://store.steampowered.com/app/570/';
const Crawler = require('../index');

require('./lib/requestPage')(url, (err, content) => {
  if(content) {
    Crawler(content, setting)
      .catch(console.error)
      .then(console.log);
  }

  else
    console.log('No content');
});
