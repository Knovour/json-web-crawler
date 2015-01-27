console.log('Crawl Dota 2 description at Steam site. \n');

var setting = {
  type: 'content',
  container: '#game_highlights .rightcol',
  keys: [{
  	name: 'appId',
  	elem: '.glance_tags',
  	get:  ['data', 'appid']
  }, {
    name: 'name',
    outOfContainer: true,
    elem: '.apphub_AppName',
    get:  'text'
  }, {
  	name: 'image',
  	elem: '.game_header_image_full',
  	get:  ['attr', 'src']
  }, {
    name: 'reviews',
    elem: '.game_review_summary',
    get:  'text',
  }, {
  	name: 'tags',
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
  }, {
  	name: 'allTags',
  	elem: '.glance_tags a.app_tag',
  	collect: {
  		loop: true,
  		get:  'text',
  		combineWith: ', '
  	}
  }, {
    name: 'description',
    elem: '.game_description_snippet',
    get:  'text'
  }, {
    name: 'releaseDate',
    elem: '.release_date .date',
    get:  'text'
  }]
};

var url = 'http://store.steampowered.com/app/570/';
var Crawler = require('../index');

require('./lib/requestPage')(url, function(err, content) {
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
