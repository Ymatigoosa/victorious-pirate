import FirebaseService from 'stores/FirebaseService';

const firebaseUrl = window._FIREBASEURL;

console.log('firebaseUrl', firebaseUrl);

const initialState = new FirebaseService(firebaseUrl);

function reducer(state = initialState, action) {
  //console.log(123, state);
  switch (action.type) {

    default:
      return state;
  }
}

export default reducer;
