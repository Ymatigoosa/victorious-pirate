import { SET_USER, SET_USER_LOAD, CLEAN_USER } from 'actions/userActions';
import User from 'stores/User';

const initialState = new User(null);

export function user(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return new User(action.playload);

    case SET_USER_LOAD:
      return new User('load');

    case CLEAN_USER:
      return new User(null);

    default:
      return state;
  }
}
