import { SET_USER, SET_USER_LOAD, CLEAN_USER } from 'actions/userActions';
import User from 'stores/User';
import { createReducer } from 'utils/Utils';

const initialState = new User(null);

export default createReducer(initialState, {
  [SET_USER]: (state, action) => new User(action.playload),

  [SET_USER_LOAD]: (state, action) => new User('load'),

  [CLEAN_USER]: (state, action) => new User(null),

});
