const co = require('co');
const _ = require('lodash');
const jQuery = require('jquery');
const jsdom = require('jsdom').env;

module.exports = (content, setting) => {
  return co(function*() {
    const window = yield DOM((content || '').toString()); // Prevent if content is a buffer
    const result = yield analysis(window, setting);

    window.close();
    return result;
  });
};

function DOM(content) {
  return new Promise((resolve, reject) =>
    jsdom(content, (err, window) => err ? reject(err) : resolve(window)));
}

function analysis(window, setting) {
  const $ = jQuery(window);

  if(pageNotFound($, setting.pageNotFound))
    return Promise.reject('Page not found');

  const {
    container = 'html',
    type = 'content',
    listOption = [],
    crawl: crawlData = {},
  } = setting;

  const result = (type !== 'list')
    ? crawlContent($, $(container), crawlData)
    : crawlList($, $(container), crawlData, listOption);

  return Promise.resolve(result);
}

function pageNotFound($, pageNF) { // Not completed tested yet
  let result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(json => {
      if(!$(json.elem).length)
        return '';

      const check = (json.check && json.check.length) ? json.check[0] : '';
      const value = grabValue($(json.elem), json);
      switch(check) {
        case 'equal': return _.isEqual(value, json.check[1]);
        default:      return value;
      }
    });
  }

  return (_.compact(result).join('') !== '');  // If check is all pass, return value will be ''
}

function crawlList($, $listElems, crawlData, [ _option, ..._list ]) {
  const elemLength = $listElems.length;

  const crawlInRange = ([ start, _end = elemLength ]) => {
    const end = (_end <= elemLength) ? _end : elemLength;
    return _.times((end - start), i => crawlContent($, $listElems.eq(start + i), crawlData));
  };

  const crawlInFocus = focusList =>
    focusList.map(i => (i < elemLength) ? crawlContent($, $listElems.eq(i), crawlData) : null);

  const option = _list.length ? _option : '';
  const list   = _list.map(i => (i < 0) ? (i + elemLength) : i);

  switch(option) {
    case 'ignore': return crawlInFocus(_.difference(_.range(elemLength), list));
    case 'focus':  return crawlInFocus(list);
    case 'range':  return crawlInRange(list);
    case 'limit':  return crawlInRange([ 0, list[0] ]);
    default:       return crawlInRange([ 0 ]);
  }
}

function crawlContent($, $content, crawlData) {
  return _.mapValues(crawlData, options => {
    let $elem = options.outOfContainer ? $('html') : $content;
    if(options.elem)
      $elem = $elem.find(options.elem);

    if(!$elem.length)
      return ('default' in options) ? options.default : null;

    if(options.noChild)
      $elem = $elem.children().remove().end();

    const collectOptions = options.collect;
    if(!collectOptions)
      return grabValue($elem, options);

    const dataList = (({ elems = [], loop = false }) => {
      switch(true) {
        case (elems.length > 0):
          return elems.map(tmp => {
            const $tmpElem = tmp.elem ? $elem.find(tmp.elem) : $elem;
            return $tmpElem.length ? grabValue($tmpElem, tmp) : '';
          });
        case loop:
          return $elem.map((i, e) => grabValue($(e), collectOptions)).get();
        default:
          return [];
      }
    })(collectOptions);

    return ('combineWith' in collectOptions && collectOptions.combineWith !== null)
      ? dataList.join(collectOptions.combineWith)
      : dataList;
  });
}

function grabValue($elem, json) {
  const result = format($elem, json.get);

  if(result === '' || result === null || typeof result === 'undefined')
    return ('default' in json) ? json.default : result;

  if('default' in json && result === json.default)
    return result;

  if(json.process) {
    switch(true) {
      case (json.process instanceof Array):      return process(result, json.process);
      case (typeof json.process === 'function'): return json.process(result);
    }
  }

  return result;
}

function format($elem, returnType = 'text') {
  switch(returnType.split('-')[0]) {
    case 'num':
      const num = parseFloat($elem.text().replace(/[^0-9]/g, '')); // Prevent like $1,000,000
      return !isNaN(num) ? num : 0;
    case 'text':
    case 'html':
      return $elem[returnType]().trim();
    case 'length':
      return $elem.length;
    case 'data':
      const tmp = returnType.split(/-|:/);
      const dataValue = $elem.data(tmp[1]);

      return tmp[2] ? dataValue[tmp[2]] : dataValue;
    default:
      return $elem.attr(returnType);
  }
}

_.mixin({
  match(data, regex, address) {
    const tmp = data.match(regex);
    const pointer = (typeof address !== 'undefined') ? parseFloat(address) : NaN;

    return (tmp && !isNaN(pointer)) ? (tmp[pointer] || '') : tmp;
  },
  split(data, keyword, address) {
    const tmp = data.split(keyword);
    const pointer = (typeof address !== 'undefined') ? parseFloat(address) : NaN;

    return !isNaN(pointer) ? (tmp[pointer] || '') : tmp;
  },
  replace(data, from, to) {
    return data.replace(from, to);
  },
  substring(data, start = 0, end) {
    end = end || data.length;
    return data.substring(start, end);
  },
  prepend(data, arg) {
    return arg + data;
  },
  append(data, arg) {
    return data + arg;
  },
  encode: escape,
  encodeURI,
  encodeURIComponent,
  decode: unescape,
  decodeURI,
  decodeURIComponent,
});

function process(data, processList) {
  for(let job of processList) {
    if(typeof data !== 'string')
      break;

    data = _[job[0]](data, job[1], job[2]);
  }

  return data;
}
