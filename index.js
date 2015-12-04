'use strict'

const _ = require('lodash');
const jsdom = require('jsdom').env;

module.exports = (content, setting) => {
  return new Promise((resolve, reject) => {
    // Prevent if content is a buffer
    jsdom(content.toString(), (err, window) => {
      if(err)
        return reject(err);

      const $ = require('jquery')(window);

      if(pageNotFound($, setting.pageNotFound))
        return reject('Page not found');

      const $container = $(setting.container);
      const keys = setting.keys;

      if(setting.type !== 'list')
        return resolve(crawlContent($, $container, keys));

      const $listElems = $container;
      const listLength = $listElems.length;

      const crawlInRange = listOption => {
        const start  = (listOption[0] === 'range') ? listOption[1] : 0;
        const endKey = (listOption[0] === 'range') ? ++listOption[2] : listOption[1];
        const end    = (endKey && endKey <= listLength) ? endKey : listLength;

        return _.times((end - start), i => crawlContent($, $listElems.eq(start + i), keys));
      };

      const crawlInFocus = listOption => {
        let focusList = _.rest(listOption);
        if(listOption[0] === 'ignore') {
          const ignoreList = focusList.map(i => (i < 0) ? (i + listLength) : i);
          focusList = _.chain(listLength).range().difference(ignoreList).value();
        }

        return focusList.map(i => (i < length) ? crawlContent($, $listElems.eq(i), keys) : null);
      };

      if(setting.listOption && setting.listOption.length) {
        switch(setting.listOption[0]) {
          case 'focus':
          case 'ignore':
            return resolve(crawlInFocus(setting.listOption));
          case 'range':
          case 'limit':
            return resolve(crawlInRange(setting.listOption));
        }
      }

      return resolve(crawlInRange(['range', 0]));
    });
  });
};

function pageNotFound($, pageNF) {
  let result = [];

  if(pageNF && pageNF.length) {
    result = pageNF.map(json => {
      let data = grabValue($(json.elem), json);
      data = json.process ? process(data, json.process) : data;

      return (data === json.equalTo) ? 'true' : '';
    }) || [];
  }

  return (result.join('') !== '');  // If check is all pass, return value will be ''
}

function crawlContent($, $content, keys) {
  const $_content = $content || $('html');

  return _.mapValues(keys, options => {
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

    return (typeof(collectOptions.combineWith) !== 'undefined') ? tmpArr.join(collectOptions.combineWith) : tmpArr;
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
      const tmp = $elem.text().replace(/[^0-9]/g, ''); // Prevent $1,000,000
      return !tmp ? 0 : parseFloat(tmp);
    case 'text':
    case 'html':
      return $elem[returnType]().trim();
    case 'length':
      return $elem.length;
    case 'data':
      const temp = returnType.split(/-|:/);
      const dataValue = $elem.data(temp[1]);

      return temp[2] ? dataValue[temp[2]] : dataValue;
    default:
      return $elem.attr(returnType);
  }
}

_.mixin({
  match(str, regex, address) {
    const tmp = str.match(regex);
    return (tmp && address) ? (tmp[address] || '') : tmp;
  },
  split(str, keyword, address) {
    const tmp = str.split(keyword);
    return address ? (tmp[address] || '') : tmp;
  },
  replace(str, from, to) {
    return str.replace(from, to);
  },
  substring(str, start, end) {
    start = start || 0;
    end   = end || str.length;

    return str.substring(start, end);
  },
  prepend(str, arg) {
    return arg + str;
  },
  append(str, arg) {
    return str + arg;
  },
  encode:  escape,
  encodeURI,
  encodeURIComponent,
  decode:  unescape,
  decodeURI,
  decodeURIComponent,
});

function process(str, processList) {
  for(let job of processList)
    str = _[job[0]](str, job[1], job[2]);

  return str;
}
