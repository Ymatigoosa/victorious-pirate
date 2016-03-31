import { CHANGE_EMAIL, CHANGE_PASSWORD, SET_LOGIN_ERROR, CLEAN_LOGIN, SET_EMAIL_ERROR, SET_PASSWORD_ERROR } from 'actions/loginPanelActions';

const initialState = {
  email: '',
  emailError: '',
  password: '',
  passwordError: '',
  wholeLoginError: ''
};

export function loginPanel(state = initialState, action) {
  switch (action.type) {
    case CHANGE_EMAIL:
      return {
        ...state,
        email: action.playload,
        emailError: ''
      };

    case CHANGE_PASSWORD:
      return {
        ...state,
        password: action.playload,
        passwordError: ''
      };

    case SET_EMAIL_ERROR:
      return {
        ...state,
        emailError: action.playload
      };

    case SET_PASSWORD_ERROR:
      return {
        ...state,
        passwordError: action.playload
      };

    case SET_LOGIN_ERROR:
      return {
        ...state,
        wholeLoginError: action.playload
      };

    case CLEAN_LOGIN:
      return initialState;

    default:
      return state;
  }
}
