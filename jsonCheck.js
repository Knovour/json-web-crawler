exports.start = function(json) {
  if(!json.container)
    return {pass: false, msg: 'Key not found: container'};

  if(json.type === 'list' && (!json.listElems))
    return {pass: false, msg: 'Key not found: listElems'};

  if(json.pageNotFound) {
    var result = checkWithLoop(json.pageNotFound, 'pageNotFound');

    if(!result.pass)
      return result;
  }

  if(!json.keys)
    return {pass: false, msg: 'Key not found: keys'};

  else {
    var keyList = [];
    var result = checkWithLoop(json.keys, 'keys');

    if(!result.pass)
      return result;
  }

  return {pass: true};
};

function checkWithLoop(json, parentKey) {
  var keyList = [];
  var result = {};

  json.every(function(e) {
    result = checkWithoutKeyName(e, parentKey);

    if(e.name) {
      if(result.pass && keyList.indexOf(e.name) !== -1)
        result = {pass: false, msg: 'Duplicate keys found: ' + e.name};

      else
        keyList.push(e.name);
    }

    return result.pass;
  });

  return result;
}

function checkWithKeyName(json, parentKey) {
  var result = {pass: true};
  
  if(!json.name)
    result = {pass: false, msg: 'Key not found: name in ' + parentKey};

  if(json.collect) {
    if((!json.collect.elems || json.collect.elems.length) && !json.collect.loop)
      result = {pass: false, msg: 'No "elems or loop" in ' + parentKey + '.collect'};

    else if(json.collect.elems && json.collect.elems.length) {
      json.collect.elems.every(function(e) {
        result = checkWithoutKeyName(e, parentKey + '.collect');
        return result.pass;
      });
    }
  }
  
  if(result.pass)
    result = checkWithoutKeyName(json, parentKey);

  return result;
}

function checkWithoutKeyName(json, parentKey) {
  var result = {pass: true};

  if(!json.get && !json.collect)
    result = {pass: false, msg: 'Key not found: get in ' + parentKey};

  if(json.use) {
    if(!(json.use instanceof Array) || json.use.length < 2)
      result = {pass: false, msg: 'Keyword need length not match in ' + parentKey};
  }
  
  return result;
}
