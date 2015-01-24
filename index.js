var jsonCheck = require('./jsonCheck');
var debugMode = false;

exports.start = function(setting, content, callback) {
  var checkResult = jsonCheck.start(setting);
  debugMode = setting.debug;
  if(!checkResult.pass)
    return callback(checkResult.msg, null);

  // Prevent if content is buffer
  content = content.toString();

  require('jsdom').env(content, function (errors, window) {
    var $ = require('jquery')(window);

    if(pageNotFound($, setting.pageNotFound))
      return callback('Page not found', null);

    var $container = $(setting.container);
    var keys = setting.keys;
    var data = null;

    if(setting.type === 'list') {
      var $listElems = $container.find(setting.listElems);
      var length = $listElems.length;

      if(setting.limit) {
        var limit = (setting.limit < length) ? setting.limit : length;
        data = [];
        for(var i = 0; i < limit; i++) {
          var $elem = $listElems.eq(i);
          if($elem.length)
            data.push(crawlContent($, $elem, keys));
        }
      }

      else if(setting.range) {
        data = [];
        var i = setting.range[0] || 0;
        var end = setting.range[1] || ($listElems.length - 1);

        while(end > i) {
          var $elem = $listElems.eq(i);
          if($elem.length)
            data.push(crawlContent($, $elem, keys));

          i++;
        }
      }

      else if(setting.focus) {
        data = setting.focus.map(function(i) {
          var $elem = $listElems.eq(i);
          return ($elem.length) ? crawlContent($, $elem, keys) : null;
        });
      }

      else if(setting.ignore) {
        setting.ignore.forEach(function(i) {
          if(i < 0)
            i += $listElems.length;

          $listElems.eq(i).remove();
        });

        $listElems = $container.find(setting.listElems);
        data = $listElems.map(function() {
          return crawlContent($, $(this), keys);
        }).get();
      }

      else {
        data = $listElems.map(function() {
          return crawlContent($, $(this), keys);
        }).get();
      }
    }

    // type: content
    else
      data = crawlContent($, $container, keys);

    callback(null, data);
  });
};

function pageNotFound($, pageNF) {
  if(debugMode) console.log('Page available checking.');

  var result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(function(json) {
      var data = getValue($(json.elem), json);
      data = (json.use || json.process) ? use(data, json) : data;

      return (data === json.equalTo) ? 'true' : '';
    }) || [];
  }

  return (result.join('') !== '');  // If check is all pass, return value will be ''
}

function crawlContent($, $content, keys) {
  var data = {};
  var $_content = $content || $('html');
  keys.forEach(function(singleKey) {
    var $elem = $_content;
    if(singleKey.elem)
      $elem = singleKey.outOfContainer ? $('html').find(singleKey.elem) : $_content.find(singleKey.elem);

    if($elem.length) {
      if(singleKey.noChild)
        $elem = $elem.children().remove().end();

      if(singleKey.collect) {
        var tmpArr = [];
        if(singleKey.collect.elems) {
          tmpArr = singleKey.collect.elems.map(function(tmp) {
            var $tmpElem = tmp.elem ? $elem.find(tmp.elem) : $elem;

            return ($tmpElem.length) ? getValue($tmpElem, tmp) : '';
          });
        }

        else if(singleKey.collect.loop) { // loop: true
          tmpArr = $elem.map(function() {
            return getValue($(this), singleKey.collect);
          }).get();
        }

        data[singleKey.name] = singleKey.collect.combineWith ? tmpArr.join(singleKey.collect.combineWith) : tmpArr;
      }

      else
        data[singleKey.name] = getValue($elem, singleKey);
    }
  });

  return data;
}

// get
function getValue($elem, json) {
  var result = null;

  var get = json.get;
  if(json.get instanceof Array && json.get.length)
    get = json.get[0];

  switch(get) {
    case 'text':
      result = ($elem.text() || '').trim();
      break;
    case 'num':
      var tmp = ($elem.text() || '0').trim().replace(/[^0-9]/g, ''); // Prevent like $1,000,000
      result = (!tmp) ? 0 : parseFloat(tmp);
      break;
    case 'html':
      result = ($elem.html() || '').trim();
      break;
    case 'length':
      result = $elem.length;
      break;
    case 'attr':
      result = ($elem.attr(json.get[1]) || '').trim();
      break;
    case 'data':
      result = $elem.data(json.get[1]);
      if(json.get[2])
        result = result[json.get[2]];
      break;
  }

  if(json.decode) {

  }

  return (json.use || json.process) ? use(result, json) : result;
}

// use, process
function use(str, json) {
  var result = null;
  if(json.use && json.use.length)
    result = advProcess(str, json.use);

  else if(json.process && json.process.length) {
    var tmp = str;
    json.process.forEach(function(use) {
      tmp = advProcess(tmp, use);
    });

    result = tmp;
  }

  return result;
}

function advProcess(str, use) {
  var result = str || '';
  switch(use[0].toLowerCase()) {
    case 'decode':
      switch(use[1].toLowerCase()) {
        case 'decodeuri':
          result = decodeURI(result);
          break;
        case 'decodeuricomponent':
          result = decodeURIComponent(result);
          break;
        default:
          result = unescape(result);
          break;
      }
      break;
    case 'encode':
      switch(use[1].toLowerCase()) {
        case 'encodeuri':
          result = encodeURI(result);
          break;
        case 'encodeuricomponent':
          result = encodeURIComponent(result);
          break;
        default:
          result = escape(result);
          break;
      }
      break;
    case 'index':
      result = (result.indexOf(use[1]) !== -1);
      break;
    case 'match':
      var get = use[2] || 0;
      result = result.match(use[1]);
      if(result)
        result = result[get].trim() || '';
      break;
    case 'split':
      var tmp = result.split(use[1]);
      var get = parseFloat(use[2]);
      if(use.length < 3 || isNaN(get))
        get = tmp.length - 1;

      else if(get < 0)
        get = 0;

      result = tmp[get] ? tmp[get].trim() : tmp[get];
      break;
    case 'replace':
      result = result.replace(use[1], use[2]).trim();
      break;
    case 'substring':
      var start = use[1] || 0;
      var end   = use[2] || result.length;

      result = result.substring(start, end);
      break;
    case 'prepend':
      result = use[1] + result;
      break;
    case 'append':
      result += (use[1] || '');
      break;
  }

  return result;
}
