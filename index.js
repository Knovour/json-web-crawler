'use strict'

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
  return new Promise((resolve, reject) => {
    const $ = jQuery(window);

    if(pageNotFound($, setting.pageNotFound))
      return reject('Page not found');

    const $container = $(setting.container);
    const crawlData = setting.crawl;

    // type: content
    if(setting.type !== 'list')
      return resolve(crawlContent($, $container, crawlData));

    // type: list
    const $listElems = $container;
    const elemListLength = $listElems.length;

    const crawlInRange = range => {
      const start = range[0];
      const end   = (range[1] && range[1] <= elemListLength) ? range[1] : elemListLength;

      return _.times((end - start), i => crawlContent($, $listElems.eq(start + i), crawlData));
    };

    const crawlInFocus = focusList =>
      focusList.map(i => (i < elemListLength) ? crawlContent($, $listElems.eq(i), crawlData) : null);

    const crawlList = listOption => {
      let option = '';
      let list = [];
      if(listOption && listOption.length && listOption.length > 1) {
        option = listOption[0];
        list   = _.tail(listOption).map(i => (i < 0) ? (i + elemListLength) : i);
      }

      switch(option) {
        case 'ignore': return crawlInFocus(_.difference(_.range(elemListLength), list));
        case 'focus':  return crawlInFocus(list);
        case 'range':  return crawlInRange(list);
        case 'limit':  return crawlInRange([ 0, list[0] ]);
        default:       return crawlInRange([ 0 ]);
      }
    }

    return resolve(crawlList(setting.listOption))
  });
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

function crawlContent($, $content, crawlData) {
  const $_content = $content || $('html');

  return _.mapValues(crawlData, options => {
    let $elem = options.outOfContainer ? $('html') : $_content;
    if(options.elem)
      $elem = $elem.find(options.elem);

    if(!$elem.length)
      return options.default ? options.default : null;

    if(options.noChild)
      $elem = $elem.children().remove().end();

    const collectOptions = options.collect;
    if(!collectOptions)
      return grabValue($elem, options);

    let tmpArr = [];
    if(collectOptions.elems) {
      tmpArr = collectOptions.elems.map(tmp => {
        const $tmpElem = tmp.elem ? $elem.find(tmp.elem) : $elem;
        return $tmpElem.length ? grabValue($tmpElem, tmp) : '';
      });
    }

    else if(collectOptions.loop)
      tmpArr = $elem.map((i, e) => grabValue($(e), collectOptions)).get();

    return (typeof collectOptions.combineWith !== 'undefined' && collectOptions.combineWith !== null)
      ? tmpArr.join(collectOptions.combineWith)
      : tmpArr;
  });
}

function grabValue($elem, json) {
  const result = grab($elem, json);

  if(json.default && result === json.default)
    return result;

  if(json.process) {
    switch(true) {
      case (json.process instanceof Array):      return process(result, json.process);
      case (typeof json.process === 'function'): return json.process(result);
    }
  }

  return result;
}

function grab($elem, json) {
  const returnType = json.get;

  let value = null;
  switch(returnType.split('-')[0]) {
    case 'num':
      const num = parseFloat($elem.text().replace(/[^0-9]/g, '')); // Prevent $1,000,000
      value = !isNaN(num) ? num : 0;
      break;
    case 'text':
    case 'html':
      value = $elem[returnType]().trim();
      break;
    case 'length':
      value = $elem.length;
      break;
    case 'data':
      const tmp = returnType.split(/-|:/);
      const dataValue = $elem.data(tmp[1]);

      value = tmp[2] ? dataValue[tmp[2]] : dataValue;
      break;
    default:
      value = $elem.attr(returnType);
  }

  if((value === '' || value === null || typeof value === 'undefined') && json.default)
    value = json.default;

  return value;
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
  substring(data, start, end) {
    start = start || 0;
    end   = end || data.length;

    return data.substring(start, end);
  },
  prepend(data, arg) {
    return arg + data;
  },
  append(data, arg) {
    return data + arg;
  },
  encode:  escape,
  encodeURI,
  encodeURIComponent,
  decode:  unescape,
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
