import FirebaseService from 'stores/FirebaseService';

const initialState = new FirebaseService('https://victorious-pirate.firebaseio.com');

function reducer(state = initialState, action) {
  //console.log(123, state);
  switch (action.type) {

    default:
      return state;
  }
}

export default reducer;
