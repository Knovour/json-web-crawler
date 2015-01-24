var setting = {
  type: 'list',
  pageNotFound: [{
  	elem: '.grey-frame-inner h1',
  	get:  'text',
  	equalTo: '404'
  }],
  container: '#projects_list',
  listElems: '.project-card',
  keys: [{
    name: 'projectId',
    get:  ['data', 'project', 'id'],
  }, {
    name: 'name',
    elem: '.project-title',
    get:  'text',
  }, {
  	name: 'image',
  	elem: '.project-thumbnail img',
  	get:  ['attr', 'src']
  }, {
    name: 'link',
    elem: '.project-title a',
    get:  ['attr', 'href'],
    process: [
    	['split', '?', 0],
    	['prepend', 'https://www.kickstarter.com']
    ]
  }, {
    name: 'description',
    elem: '.project-blurb',
    get:  'text'
  }, {
    name: 'funded',
    elem: '.project-stats-value:eq(0)',
    get:  'text'
  }, {
  	name: 'percentPledged',
  	elem: '.project-percent-pledged',
  	get:  ['attr', 'style'],
  	use:  ['split', /:\s?/g, 1]
  }, {
    name: 'pledged',
    elem: '.money.usd',
    get:  'num'
  }]
};

var url = 'https://www.kickstarter.com/discover/popular?ref=popular';
var Crawler = require('../index');
var Request = require('request');

RequestPage(url, function(err, content) {
  if(content) {
    Crawler.start(setting, content, function(err, result) {
      if(err)
        console.log('Err: ' + err);
        
      console.log(result);
      process.exit(0);
    });
  }
  
  else
    console.log('No content');
});


function RequestPage (url, callback) {
  console.log('Request: ' + url);

  var query = {
    uri: encodeURI(url),
    timeout: 20000,
   // proxy: 'http://proxy.hinet.net:80'
  }
  Request(query, function(e, res, body) {
    if(e || !res.statusCode)
      callback(null, null);

    else if(!e && res.statusCode === 200)
      callback(null, body);

    else if(res.statusCode === 404) {
      console.log('404 Error requesting page %s', url);
      callback(null, null);
    }

    else {
      console.log('Error requesting page %s', url);
      callback(e, null);
    }
  });
};
