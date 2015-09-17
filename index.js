var _ = require('lodash');

module.exports = function(content, setting, callback) {
  // Prevent if content is buffer
  content = content.toString();

  require('jsdom').env(content, function (err, window) {
    var $ = require('jquery')(window);

    if(pageNotFound($, setting.pageNotFound))
      return callback('Page not found', null);

    var $container = $(setting.container);
    var keys = setting.keys;
    var data = null;

    if(setting.type === 'list') {
      var $listElems = $container;
      var length = $listElems.length;

      var range = function(start, end) {
        var times = (start === 0) ? end : (end - start + 1);

        return _.times(times, function(i) {
          return crawlContent($, $listElems.eq(start + i), keys)
        });
      };

      var focus = _.partialRight(_.map, function(i) {
        return (i < length) ? crawlContent($, $listElems.eq(i), keys) : null;
      });

      var listOption = setting.listOption || [];
      switch(listOption[0]) {
        case 'limit':
          var limit = (listOption[1] && listOption[1] <= length) ? listOption[1] : length;
          data = range(0, limit);
          break;
        case 'range':
          var start = listOption[1];
          var end = (listOption[2] && listOption[2] < length) ? listOption[2] : (length - 1);
          data = range(start, end);
          break;
        case 'focus':
          data = focus(_.rest(listOption));
          break;
        case 'ignore':
          var focusList = _.flow(
            _.rest,
            _.map(function(i) {
              return (i < 0) ? i + length : i;
            }),
            _.partial(_.difference, _.range(length))
          );

          data = focus(focusList(listOption));
          break;
        default:
          data = range(0, length);
      }
    }

    // type: content
    else
      data = crawlContent($, $container, keys);

    callback(null, data);
  });
};

function pageNotFound($, pageNF) {
  var result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(function(json) {
      var data = getValue($(json.elem), json);
      data = json.process ? doProcess(data, json.process) : data;

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

    if($elem.length) {
      if(options.noChild)
        $elem = $elem.children().remove().end();

      var collectOptions = options.collect;
      if(collectOptions) {
        var tmpArr = [];
        if(collectOptions.elems) {
          tmpArr = collectOptions.elems.map(function(tmp) {
            var $tmpElem = tmp.elem ? $elem.find(tmp.elem) : $elem;

            return ($tmpElem.length) ? getValue($tmpElem, tmp) : '';
          });
        }

        else if(collectOptions.loop) {
          tmpArr = $elem.map(function() {
            return getValue($(this), collectOptions);
          }).get();
        }

        return (typeof(collectOptions.combineWith) !== 'undefined') ? tmpArr.join(collectOptions.combineWith) : tmpArr;
      }

      else
        return getValue($elem, options);
    }
  });
}

function getValue($elem, json) {
  var result = null;

  var returnType = json.get;
  switch(returnType) {
    case 'text':
      result = $elem.text().trim();
      break;
    case 'num':
      var tmp = $elem.text().replace(/[^0-9]/g, '').trim(); // Prevent $1,000,000
      result = (!tmp) ? 0 : parseFloat(tmp);
      break;
    case 'html':
      result = $elem.html().trim();
      break;
    case 'length':
      result = $elem.length;
      break;
    default:
      if(returnType.indexOf('data') !== 0)
        result = $elem.attr(returnType).trim();

      else {
        var temp = returnType.split(/-|\(|\)/);
        result = $elem.data(temp[1]);
        if(temp[2])
          result = result[temp[2]];
      }
  }

  return json.process ? doProcess(result, json.process) : result;
}

// process
function doProcess(str, processList) {
  processList.forEach(function(job) {
    str = process(str, job);
  });

  return str;
}

function process(str, job) {
  var result = str || '';
  switch(job[0]) {
    case 'indexOf':
      result = result.indexOf(job[1]);
      break;
    case 'match':
      result = result.match(job[1]);

      if(result && job[2])
        result = (result[job[2]] || '').trim();
      break;
    case 'split':
      result = result.split(job[1]);

      if(job[2])
        result = (result[job[2]] || '').trim();
      break;
    case 'replace':
      result = result.replace(job[1], job[2]).trim();
      break;
    case 'substring':
      var start = job[1] || 0;
      var end   = job[2] || result.length;

      result = result.substring(start, end);
      break;
    case 'prepend':
      result = job[1] + result;
      break;
    case 'append':
      result += job[1];
      break;
    default:
      return eval([job[0], result]);
  }

  return result;
}

// http://danthedev.com/2015/09/09/lisp-in-your-language/
// eval([function, arg]);
function eval(expression) {
  var fn = expression[0];
  var args = expression.slice(1);

  return fn.apply(null, args);
}