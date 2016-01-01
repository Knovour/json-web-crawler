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
    jsdom(content, (err, window) => err ? reject(err) : resolve(window))
  );
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
    const listLength = $listElems.length;

    const handleList = listOption => _.rest(listOption).map(i => (i < 0) ? (i + listLength) : i);

    const crawlInRange = listOption => {
      const start = listOption[1];
      const end   = (listOption[2] && listOption[2] <= listLength) ? listOption[2] : listLength;

      return _.times((end - start), i => crawlContent($, $listElems.eq(start + i), crawlData));
    };

    const crawlInFocus = listOption => {
      const focusList = _.rest(listOption);
      return focusList.map(i => (i < listLength) ? crawlContent($, $listElems.eq(i), crawlData) : null);
    };

    const option = (setting.listOption && setting.listOption.length) ? setting.listOption[0] : '';
    switch(option) {
      case 'ignore':
        const focusList = _
          .chain(listLength)
          .range()
          .difference(handleList(setting.listOption))
          .value();

        return resolve(crawlInFocus(['focus'].concat(focusList)));
      case 'focus': return resolve(crawlInFocus(['focus'].concat(handleList(setting.listOption))));
      case 'range': return resolve(crawlInRange(setting.listOption));
      case 'limit': return resolve(crawlInRange(['range', 0, setting.listOption[1]]));
      default:      return resolve(crawlInRange(['range', 0]));
    }
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
