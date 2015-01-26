# Json Web Crawler

Use JSON to list all elements (with css 3 and jquery selector) that you want to crawl.

#### [Demo]
run the two scripts (kickstarter & steam) in terminal to see what happen.

## Usage
```javascript
npm i json-web-crawler --save
```
```javascript
var Crawler = require('json-web-crawler');

Crawler.start('HTML content', your json setting, function(err, result) {
  console.log(result);
});
```

## Variables
It's messy now, I know.
```javascript
var setting = {
  // @pageNotFound: if match one of these checklist, it will return page not found error.
  pageNotFound: [{
    elem: '.error-msg',
    get:  'text',    // call text()
    equalTo:  '404'  // If match, will return Not Found Error
  }],

  // 'content' or 'list', default is content
  // Content: crawl page to a single json.
  // List: crawl a list like Google search result into multi data.
  type: 'content',

  // DOM element that will focus on.
  container: '.container',

  // If type is 'list', you may need to set these values below.
  // =================================================================
  // Must have, give it an elem name to loop
  listElems: 'li.search-result',

  // Optional, use if you don't want to crawl the whole list.
  // I will use one of four optional keys only, limit > range > focus > ignore

  // Just crawl ten elements from list
  limit: 10,

  // [start, end], if without end, it will continue to the last one
  range: [0, 12],

  // [list elements]
  focus: [0, 3, 7],

  // list all possible that you might want to ignore it. You can use -1, -2 to count from backward.
  ignore: [1, 2, 5],
  // =================================================================

  // search DOM elements under $(container) or $(container).find(listElems)
  keys: [{
    key:  'main',            // Must have
    elem: '.element1:eq(0)', // Must have, If empty or undefined, it will use container or listElems instead
    noChild: true,           // Optional, remove all children elem under $element
    outOfContainer: true,    // Optional, If exist, It will use $('html').find()
    get:  'text',            // Must have,
    // get: 'num'
    // get: 'html'
    // get: 'index'
    // get: 'length'                      // => $element.length
    // get: ['attr', 'attribute']         // => $elem.attr('attribute')
    // get: ['data', 'dataAttribute', X]  // => $elem.data('dataAttribute')
    // X is optional, if data is an array, set ['data', 'dataAttribute', 0] will return $elem.data('dataAttribute')[0]
    // If data is an object, set ['data', 'dataAttribute', 'id'] will return $elem.data('dataAttribute')['id']
    // If X not exist, it will return the whole data

    use: ['index', 'textHere']  // Optional, use for advance process from 'get'
    // use: ['match', /regex here/, number]  // => str.match(/regex here/)[number]
    // use: ['split', ',', number]           // => str.split(',')[number]
    // use: ['replace', 'one', 'two']        //
    // use: ['substring', 0, 3]              //
    // use: ['prepend', 'text here']         // => 'text here' + str
    // use: ['append', 'text here']          // => ste + 'text here'

    // Optional, if use is not enough, use 'process'
    process: [
      ['match', /regex here/, number],
      ['replace', 'one', 'two'],
      ['substring', 0, 3]
    ]
  }, {
    key:  'detail',
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
          get:  ['attr', 'href']  // If no elem, the default is parent elem
      }],

      // without this, collect will return array
      combineWith: ', '
    }
  }], {
    key:  'detail2',
    elem: 'table tbody tr',

    // It will run all tr elems you set
    collect: {
      loop: true,
      get:  'text'
      combineWith: ', '
    }
  }]
};
```


## The MIT License (MIT)

Copyright (c) 2015 Knovour Zheng

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

[Demo]: http://runnable.com/VMPSRHC3Ys9L_12d/json-web-crawler
