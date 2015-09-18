var _ = require('lodash');
var jsdom = require('jsdom').env;

module.exports = function(content, setting, callback) {
  // Prevent if content is a buffer
  jsdom(content.toString(), function(err, window) {
    if(err)
      return callback(err, null);

    var $ = require('jquery')(window);

    if(pageNotFound($, setting.pageNotFound))
      return callback('Page not found', null);

    var $container = $(setting.container);
    var keys = setting.keys;

    if(setting.type !== 'list')
      return callback(null, crawlContent($, $container, keys));

    var $listElems = $container;
    var listLength = $listElems.length;

    var crawlInRange = function(listOptions) {
      var start  = (listOptions[0] === 'range') ? listOptions[1] : 0;
      var endKey = (listOptions[0] === 'range') ? ++listOptions[2] : listOptions[1];
      var end    = (endKey && endKey <= listLength) ? endKey : listLength;

      return _.times((end - start), function(i) {
        return crawlContent($, $listElems.eq(start + i), keys)
      });
    };

    var crawlInFocus = function(listOptions) {
      var focusList = _.rest(listOptions);
      if(listOptions[0] === 'ignore') {
        var ignoreList = focusList.map(function(i) {
          return (i < 0) ? (i + listLength) : i;
        });

        focusList = _.difference(_.range(listLength), ignoreList);
      }

      return focusList.map(function(i) {
        return (i < length) ? crawlContent($, $listElems.eq(i), keys) : null;
      });
    };

    switch(setting.listOption[0]) {
      case 'focus':
      case 'ignore':
        return callback(null, crawlInFocus(setting.listOption));
      case 'range':
      case 'limit':
      default:
        return callback(null, crawlInRange(setting.listOption));
    }
  });
};

function pageNotFound($, pageNF) {
  var result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(function(json) {
      var data = grabValue($(json.elem), json);
      data = json.process ? process(data, json.process) : data;

      return (data === json.equalTo) ? 'true' : '';
    }) || [];
  }

  return (result.join('') !== '');  // If check is all pass, return value will be ''
}

function crawlContent($, $content, keys) {
  var $_content = $content || $('html');

  return _.mapValues(keys, function(options) {
    var $elem = options.outOfContainer ? $('html') : $_content;
    if(options.elem)
      $elem = $elem.find(options.elem);

    if(!$elem.length)
      return null;

    if(options.noChild)
      $elem = $elem.children().remove().end();

    var collectOptions = options.collect;
    if(!collectOptions)
      return grabValue($elem, options);

    var tmpArr = [];
    if(collectOptions.elems) {
      tmpArr = collectOptions.elems.map(function(tmp) {
        var $tmpElem = tmp.elem ? $elem.find(tmp.elem) : $elem;
        return $tmpElem.length ? grabValue($tmpElem, tmp) : '';
      });
    }

    else if(collectOptions.loop) {
      tmpArr = $elem.map(function() {
        return grabValue($(this), collectOptions);
      }).get();
    }

    return (typeof(collectOptions.combineWith) !== 'undefined') ? tmpArr.join(collectOptions.combineWith) : tmpArr;
  });
}

function grabValue($elem, json) {
  var result = grab($elem, json);

  return json.process ? process(result, json.process) : result;
}

function grab($elem, json) {
  var returnType = json.get;
  switch(returnType.split('-')[0]) {
    case 'num':
      var tmp = $elem.text().replace(/[^0-9]/g, ''); // Prevent $1,000,000

      return (!tmp) ? 0 : parseFloat(tmp);
    case 'text':
    case 'html':
      return $elem[returnType]().trim();
    case 'length':
      return $elem.length;
    case 'data':
      var temp = returnType.split(/-|\(|\)/);
      var dataValue = $elem.data(temp[1]);

      return temp[2] ? dataValue[temp[2]] : dataValue;
    default:
      return $elem.attr(returnType);
  }
}

_.mixin({
  match: function(str, regex, address) {
    var tmp = str.match(regex);

    return (tmp && address) ? (tmp[address] || '') : tmp;
  },
  split: function(str, keyword, address) {
    var tmp = str.split(keyword);

    return address ? (tmp[address] || '') : tmp;
  },
  replace: function(str, from, to) {
    return str.replace(from, to);
  },
  substring: function(str, start, end) {
    start = start || 0;
    end   = end || str.length;

    return str.substring(start, end);
  },
  prepend: function(str, arg) {
    return arg + str;
  },
  append: function(str, arg) {
    return str + arg;
  },
  escape:    escape,
  encode:  _.escape,
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  unescape:  unescape,
  decode:  _.unescape,
  decodeURI: decodeURI,
  decodeURIComponent: decodeURIComponent,
});

// process
function process(str, processList) {
  processList.forEach(function(job) {
    str = _[job[0]](str, job[1], job[2]);
  });

  return str;
}
