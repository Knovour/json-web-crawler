'use strict'

const _ = require('lodash');
const jsdom = require('jsdom').env;

module.exports = (content, setting) => {
  return new Promise((resolve, reject) => {
    content = (content || '').toString(); // Prevent if content is a buffer
    jsdom(content, (err, window) => {
      if(err)
        return reject(err);

      const $ = require('jquery')(window);

      if(pageNotFound($, setting.pageNotFound))
        return reject('Page not found');

      const $container = $(setting.container);
      const crawlData = setting.crawl;

      if(setting.type !== 'list')
        return resolve(crawlContent($, $container, crawlData));

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
  });
};

function pageNotFound($, pageNF) { // Not tested yet
  let result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(json => {
      if(!$(json.elem).length)
        return '';

      const check = (json.check && json.check.length) ? json.check[0] : '';
      switch(check) {
        case 'equal':
          return _.isEqual(grabValue($(json.elem), json), json.check[1]) ? 'true' : '';
        default:
          return grabValue($(json.elem), json);
      }
    });
  }

  return (result.join('') !== '');  // If check is all pass, return value will be ''
}

function crawlContent($, $content, crawlData) {
  const $_content = $content || $('html');

  return _.mapValues(crawlData, options => {
    let $elem = options.outOfContainer ? $('html') : $_content;
    if(options.elem)
      $elem = $elem.find(options.elem);

    if(!$elem.length)
      return null;

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

    return (typeof collectOptions.combineWith !== 'undefined') ? tmpArr.join(collectOptions.combineWith) : tmpArr;
  });
}

function grabValue($elem, json) {
  const result = grab($elem, json);
  return (json.process && json.process.length) ? process(result, json.process) : result;
}

function grab($elem, json) {
  const returnType = json.get;
  switch(returnType.split('-')[0]) {
    case 'num':
      const num = parseFloat($elem.text().replace(/[^0-9]/g, '')); // Prevent $1,000,000
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
    return (tmp && address) ? (tmp[address] || '') : tmp;
  },
  split(data, keyword, address) {
    const tmp = data.split(keyword);
    return address ? (tmp[address] || '') : tmp;
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
  for(let job of processList)
    data = _[job[0]](data, job[1], job[2]);

  return data;
}
