console.info('Crawl the popular list at Kickstarter. \n');

const setting = {
  type: 'list',
  container: '#projects_list .project-card',
  pageNotFound: [{
    elem: '.grey-frame-inner h1',
    get:  'text',
    equalTo: '404'
  }],
  // listOption: [ 'limit', 3 ],
  // listOption: [ 'range', 0, 6 ],
  listOption: [ 'ignore', 0, 2, -1 ],
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
};

const url = 'https://www.kickstarter.com/discover/popular?ref=popular';
const Crawler = require('../index');

require('./lib/requestPage')(url, (err, content) => {
  if(content) {
    Crawler(content, setting)
      .then(console.log)
      .catch(console.error);
  }

  else
    console.log('No content');
});
