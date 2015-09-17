console.log('Crawl the popular list at Kickstarter. \n');

var setting = {
  type: 'list',
  container: '#projects_list .project-card',
  pageNotFound: [{
    elem: '.grey-frame-inner h1',
    get:  'text',
    equalTo: '404'
  }],
  keys: {
    projectID: {
      get: 'data-project(id)',
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
        ['split', '?', 0],
        ['prepend', 'https://www.kickstarter.com']
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
        ['split', /:\s?/g, 1]
      ]
    },
    pledged: {
      elem: '.money.usd',
      get:  'num'
    }
  }
};

var url = 'https://www.kickstarter.com/discover/popular?ref=popular';
var Crawler = require('../index');

require('./lib/requestPage')(url, function(err, content) {
  if(content) {
    Crawler(content, setting, function(err, result) {
      if(err)
        console.log('Err: ' + err);

      console.log(result);
      process.exit(0);
    });
  }

  else
    console.log('No content');
});
