import { setUser, setUserLoad, cleanUser } from 'actions/userActions';
import { toggleLeftNav, toggleLoginDialog, toggleProfileDialog} from 'actions/layoutActions';
import isNullOrWhitespace from 'utils/isNullOrWhitespace';

export const CHANGE_EMAIL = 'CHANGE_EMAIL';
export const CHANGE_PASSWORD = 'CHANGE_PASSWORD';
export const SET_LOGIN_ERROR = 'SET_LOGIN_ERROR';
export const SET_EMAIL_ERROR = 'SET_EMAIL_ERROR';
export const SET_PASSWORD_ERROR = 'SET_PASSWORD_ERROR';
export const CLEAN_LOGIN = 'CLEAN_LOGIN';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGIN';

export function changeEmail(email) {
  return {
    type: CHANGE_EMAIL,
    playload: email
  };
}
export function changePassword(password) {
  return {
    type: CHANGE_PASSWORD,
    playload: password
  };
}
export function setEmailError(error) {
  return {
    type: SET_EMAIL_ERROR,
    playload: error
  };
}
export function setPasswordError(error) {
  return {
    type: SET_PASSWORD_ERROR,
    playload: error
  };
}
export function setLoginError(error) {
  return {
    type: SET_LOGIN_ERROR,
    playload: error
  };
}
export function cleanLogin() {
  return {
    type: CLEAN_LOGIN
  };
}
export function initAuth() {
  return (dispatch, getState) => {
    const { firebaseService } = getState();
    console.log('initAuth');
    const authData = firebaseService.ref.getAuth();
    if (authData != null)
    {
      dispatch(setUserLoad());
      firebaseService.getUserFromFirebase(authData.uid, function (snap) {
        //console.log('must be set user');
        dispatch(setUser(snap.val()));
      });
    }
  }
}
export function login() {
  return (dispatch, getState) => {
    const { firebaseService, user, loginPanel: {email, password }} = getState();
    console.log('login');
    if (user.data != null)
      return;

    var errors = false;
    if (isNullOrWhitespace(email)) {
      dispatch(setEmailError('Обязательное поле'));
      errors = true;
    }
    if (isNullOrWhitespace(password)) {
      dispatch(setPasswordError('Обязательное поле'));
      errors = true;
    }
    if (!errors)
    {
      dispatch([
        setUserLoad(),
        setLoginError('')
      ]);

      firebaseService.loginWithPW({
        'email': email,
        'password': password
      }, loginCb.bind(null, dispatch, getState));
    }
  }
}
export function logout() {
  return (dispatch, getState) => {
    const { firebaseService, user } = getState();
    if (user.data == null)
      return;

    firebaseService.logout(logoutCb.bind(null, dispatch, getState));
  }
}

const logoutCb = (dispatch, getState, error, user) => {
  dispatch([
    cleanUser(),
    toggleProfileDialog()
  ]);
}
const loginCb = (dispatch, getState, error, user) => {
  if (error) {
    dispatch([
      cleanUser(),
      setLoginError(error)
    ]);
  } else {
    dispatch([
      setUser(user),
      cleanLogin(),
      toggleLoginDialog()
    ]);
    ;
  }
}
