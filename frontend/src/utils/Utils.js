export function isNullOrWhitespace ( str ) {
    if (typeof str === 'undefined' || str == null)
      return true;

    return str.replace(/\s/g, '').length < 1;
}

export function intersperse(array, something) {
  if (array.length < 2) { return array }
  var result = [], i = 0, l = array.length
  if (typeof something == 'function') {
    for (; i < l; i ++) {
      if (i !== 0) { result.push(something()) }
      result.push(array[i])
    }
  }
  else {
    for (; i < l; i ++) {
      if (i !== 0) { result.push(something) }
      result.push(array[i])
    }
  }
  return result
}

export function deleteAllFromFirebase(snapshot) {
  const hastable = snapshot.val();
  if (hastable === null)
    return;

  const ref = snapshot.ref();
  const update = Object.keys(hastable).reduce((result, k) => {
    result[k] = null;
    return result;
  }, {});
  console.log(update);
  ref.update(update);
}

export function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    } else {
      return state
    }
  }
}
