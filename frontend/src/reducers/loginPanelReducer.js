import { CHANGE_EMAIL, CHANGE_PASSWORD, SET_LOGIN_ERROR, CLEAN_LOGIN, SET_EMAIL_ERROR, SET_PASSWORD_ERROR } from 'actions/loginPanelActions';
import { createReducer } from 'utils/Utils';

const initialState = {
  email: '',
  emailError: '',
  password: '',
  passwordError: '',
  wholeLoginError: ''
};

export default createReducer(initialState, {
  [CHANGE_EMAIL]: (state, action) => ({
    ...state,
    email: action.playload,
    emailError: ''
  }),

  [CHANGE_PASSWORD]: (state, action) => ({
      ...state,
      password: action.playload,
      passwordError: ''
  }),

  [SET_EMAIL_ERROR]: (state, action) => ({
    ...state,
    emailError: action.playload
  }),

  [SET_PASSWORD_ERROR]: (state, action) => ({
    ...state,
    passwordError: action.playload
  }),

  [SET_LOGIN_ERROR]: (state, action) => ({
    ...state,
    wholeLoginError: action.playload
  }),

  [CLEAN_LOGIN]: (state, action) => initialState,

});
