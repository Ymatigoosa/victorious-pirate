import { ActionTypes } from 'actions/userManagerActions';
import { createReducer } from 'utils/Utils';

const initialState = {
  search: '',
  dialog: {
      itemKey: null,
      state: 'hide',
      email: '',
      password: '',
      fullname: '',
      about: '',
      error: '',
      roles: {

      }
  }
};

export default createReducer(initialState, {
  [ActionTypes.SET_USERMANAGER_SEARCH]: (state, action) => ({...state, search: action.playload}),

  [ActionTypes.SET_USERMANAGER_DIALOG]: (state, action) => ({
    ...state,
    dialog: action.playload == null ? initialState.dialog : {
      ...state.dialog,
      ...action.playload,
      error: action.playload.error !== void 0 ? action.playload.error : ''
    }
  })

});
