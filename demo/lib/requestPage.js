var Request = require('request');

module.exports = (url, callback) => {
  console.log('Request: ' + url);

  const query = {
    uri: encodeURI(url),
    timeout: 20000
  };

  Request(query, (e, res, body) => {
    if(e || !res.statusCode)
      callback(null, null);

    else if(!e && res.statusCode === 200)
      callback(null, body);

    else if(res.statusCode === 404) {
      console.log('404 Error requesting page %s', url);
      callback(null, null);
    }

    else {
      console.log('Error requesting page %s', url);
      callback(e, null);
    }
  });
};
