# Json Web Crawler

[![NPM version](https://d25lcipzij17d.cloudfront.net/badge.svg?id=gh&type=6&v=0.7.3&x2=0)](https://www.npmjs.com/package/json-web-crawler)
[![Node version](https://img.shields.io/badge/node-%3E=%206.0.0-brightgreen.svg)]()
[![Open Source Love](https://badges.frapsoft.com/os/mit/mit.svg?v=102)](https://github.com/ellerbrock/open-source-badge/)

Use JSON to list all elements (with css 3 and jquery selector) that you want to crawl.

**[Demo]**

## Usage

```javascript
npm i json-web-crawler --save
```
```javascript
const crawl = require('json-web-crawler');

crawl('HTML content', your json setting)
  .then(console.log)
  .catch(console.error);
```

## Settings

### type

The default type is `content`.

- content: crawl specific $container to a single json.
- list: crawl a list like Google search result into multi data.

### container

DOM element that will focus on. If type is `list`, it will crawl each container class.

### listOption

Optional, enable in `list` type only, use when you don't want to crawl the whole list. ** ALL STRAT FROM 0 **

- `[ 'limit', 10 ]`: ten elements only (eq(0) ~ eq(9)).
- `[ 'range', 6, 12 ]`: from eq(6) to eq(12 - 1). If without end, it will continue to the last one.
- `[ 'focus', 0, 3, 7, ... ]`: specific elements in list (eq(0), eq(3), eq(7), ...). You can use -1, -2 to count from backward.
- `[ 'ignore', 1, 2, 5 ]`: elements you want to ignore it. You can use -1, -2 to count from backward.

### crawl

`keyName: { options }` => `keyName: data`

```javascript
crawl: {
  image: {
    elem: 'img',
    get: 'src'
  }
}

// will become
image: IMAGE_SRC_URL
```

#### options

- elem: element inside `container`. If empty or undefined, it will use `container` or `listElems` instead
- noChild (boolean): remove all children elem under $(elem)
- outOfContainer (boolean): If exist, It will use $('html').find(elem)
- get: return type of element
  - `text`
  - `num`
  - `length`: $element.length
  - `attrName`: $element.attr('attrName')
  - `data-dataName`: $element.data('dataNAme')
  - `data-dataName:X`: `X` is optional.
    - If data is an array, set `data-dataName:0` will return `$elem.data('dataAttribute')[0]`.
    - If data is an object, set `data-dataName:id` will return `$elem.data('dataAttribute')['id']`.
    - If X not exist, it will return the whole data.
- process: If you want to do something else after 'get' (string type only)

```javascript
// You can use some simple functions that existed in lodash.
process: [
  ['match', /regex here/, number],  // => str.match(/regex here/)[number], return array if no number, but will cause other process won't work
  ['split', ',', number],           // => str.split(',')[number], return array if no number, but will cause other process won't work
  ['replace', 'one', 'two'],
  ['substring', 0, 3],
  ['prepend', 'text'],              // => 'text' + value
  ['append', 'text'],               // => value + 'text'
  ['indexOf', 'text']               // => return number
  ['INDENPENDENT_FUNCTION'],        // like encodeURI, encodeURIComponent, unescape, etc...
  /**
    * Due to lodash has the same name `escape` & `unescape` functions with
    * different behavior, the origin `escape` & `unescape` function will
    * renamed to `encode` & `decode` instead.
    */
],

// Or you want to DIY, you can use function instead
process(value, $elem /* jquery dom */) {
  // do something

  return newValue;
}
```

- collect: If the value you want is sperated to several elements, use collect to find them all.
  - elems: contain multi elements array.
  - loop (boolean): It will run all elems (like `li`) you want to get
  - combineWith: without this, collect will return array

- default: return default value when elem not found, null or undefined (`process` will be ignored)

### pageNotFound

If match, it will return page not found error.

- elem
- get
- check: like `process`, but only one step

## Example

### Content Type

Steam Dota2 page in `demo`.

```javascript
const setting = {
  type: 'content',
  container: '#game_highlights .rightcol',
  crawl: {
    appId: {
      elem: '.glance_tags',
      get:  'data-appid'
    },
    appName: {
      outOfContainer: true,
      elem: '.apphub_AppName',
      get:  'text'
    },
    image: {
      elem: '.game_header_image_full',
      get:  'src'
    },
    reviews: {
      elem: '.game_review_summary:eq(0)',
      get:  'text',
    },
    tags: {
      elem: '.glance_tags',
      collect: {
        elems: [{
          elem: 'a.app_tag:eq(0)',
          get:  'text'
        }, {
          elem: 'a.app_tag:eq(1)',
          get:  'text'
        }, {
          elem: 'a.app_tag:eq(2)',
          get:  'text'
        }],
        combineWith: ', '
      }
    },
    allTags: {
      elem: '.glance_tags a.app_tag',
      collect: {
        loop: true,
        get:  'text',
        combineWith: ', '
      }
    },
    description: {
      elem: '.game_description_snippet',
      get:  'text',
      process(value, $elem) {
        return value.split(', ');
      }
    },
    releaseDate: {
      elem: '.release_date .date',
      get:  'text'
    }
  }
};
```

### List Type

KickStarter popular list in `demo`.

```javascript
const setting = {
  pageNotFound: [{
    elem: '.grey-frame-inner h1',
    get:  'text',
    check: ['equal', '404']
  }],
  type: 'list',
  container: '#projects_list .project-card',
  listOption: [ 'limit', 3 ],
  // listOption: [ 'range', 0, 10 ],
  // listOption: [ 'ignore', 0, 2, -1 ],
  // listOption: [ 'focus', 3, -3 ],
  crawl: {
    projectID: {
      get: 'data-pid',
    },
    name: {
      elem: '.project-title',
      get:  'text',
    },
    image: {
      elem: '.project-thumbnail img',
      get:  'src'
    },
    link: {
      elem: '.project-title a',
      get:  'href',
      process: [
        [ 'split', '?', 0 ],
        [ 'prepend', 'https://www.kickstarter.com' ]
      ]
    },
    description: {
      elem: '.project-blurb',
      get:  'text'
    },
    funded: {
      elem: '.project-stats-value:eq(0)',
      get:  'text'
    },
    percentPledged: {
      elem: '.project-percent-pledged',
      get:  'style',
      process: [
        [ 'split', /:\s?/g, 1 ]
      ]
    },
    pledged: {
      elem: '.money.usd',
      get:  'num'
    }
  }
};
```

[Demo]: https://tonicdev.com/knovour/json-web-crawler-demo
