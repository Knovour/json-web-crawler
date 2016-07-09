# Json Web Crawler

Use JSON to list all elements (with css 3 and jquery selector) that you want to crawl.
Only run in node >= 6.0

**[Demo]**

## Usage
```javascript
npm i json-web-crawler --save
```
```javascript
const Crawl = require('json-web-crawler');

Crawl('HTML content', your json setting)
  .then(console.log)
  .catch(console.error);
```

## Settings

```javascript
const settings = {
  // If match one of this checklist, it will return page not found error.
  pageNotFound: [{
    elem: '.error-msg',
    get:  'text',
    check: ['equal', '404']  // No `process` here
  }],

  // 'content' or 'list', default is content if not set
  // Content: crawl page to a single json.
  type: 'content',
  // DOM element that will focus on.
  container: '.container',

  // or
  // List: crawl a list like Google search result into multi data.
  type: 'list',
  // DOM element that will loop to crawl
  container: 'li.search-result',

  // If type is 'list', you can set these values below (Optional).
  // =================================================================
  // Optional, use if you don't want to crawl the whole list. ** ALL STRAT FROM 0 **
  listOption: ['limit', 10],           // eq(0) ~ eq(9)
  //          ['range', 6, 12],     // eq(6) ~ eq(11)*, if without end, it will continue to the last one
  //          ['focus', 0, 3, 7],   // [eq(0), eq(3), eq(7)]
  //          ['ignore', 1, 2, 5],  // Elements you want to ignore it. You can use -1, -2 to count from backward.
  // =================================================================

  crawl: {
    keyName: {
      elem: '.element1:eq(0)', // Must have, If empty or undefined, it will use container or listElems instead
      noChild: true,           // Optional, remove all children elem under $(elem)
      outOfContainer: true,    // Optional, If exist, It will use $('html').find()
      get: 'text',
      //   'num'
      //   'html'
      //   'length'            // => $element.length
      //   'attrName'          // => $elem.attr('attrName')
      //   'data-dataName'     // => $elem.data('dataNAme')
      //   'data-dataName:X'
      //      X is optional, if data is an array, set 'data-dataName:0' will return $elem.data('dataAttribute')[0]
      //      If data is an object, set 'data-dataName:id' will return $elem.data('dataAttribute')['id']
      //      If X not exist, it will return the whole data

      // Optional, if you want to do something else after 'get' (string type only)
      // You can use some simple functions that existed in (lodash)[https://lodash.com/docs].
      process: [
        ['match', /regex here/, number],  // => str.match(/regex here/)[number], return array if no number, but will cause other process won't work
        ['split', ',', number],           // => str.split(',')[number], return array if no number, but will cause other process won't work
        ['replace', 'one', 'two'],
        ['substring', 0, 3],
        ['prepend', 'text'],              // => 'text' + value
        ['append', 'text'],               // => value + 'text'
        ['indexOf', 'text']               // => return number
        ['INDENPENDENT_FUNCTION'],         // like encodeURI, encodeURIComponent, unescape, etc...
        // Due to lodash has the same name `escape` & `unescape` functions with different behavior,
        // the origin `escape` & `unescape` function will renamed to `encode` & `decode` instead.
      ],

      // Or you want to DIY, you can use function instead
      process(value) {
        // do something

        return newValue;
      },
      default: '' // return default value when elem not found, null or undefined (`process` will be ignored)
    },
    keyName2: {
      elem: 'table tbody',

      // If the value you want is sperated to several elements, use collect to get all elems
      collect: {
        elems: [{
          elem: 'tr:nth-child(1)',
          get:  'text',
        }, {
          elem: 'tr:nth-child(2)',
          get:  'num',
        }, {
          get:  'href'  // If no elem, the default is parent elem $(table tbody)
        }],

        // without this, collect will return array
        combineWith: ', '
      }
    },
    keyName3: {
      elem: 'table tbody tr',
      // It will run all tr elems you set
      collect: {
        loop: true,
        get:  'text',
        combineWith: ', '
      }
    }
  }
};
```


## The MIT License (MIT)

Copyright (c) 2016 Knovour Zheng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[Demo]: https://tonicdev.com/knovour/json-web-crawler-demo
