import { push, replace, go, goForward, goBack } from 'react-router-redux'

export const TOGGLE_LEFT_NAV = 'TOGGLE_LEFT_NAV';
export const TOGGLE_LOGIN_DIALOG = 'TOGGLE_LOGIN_DIALOG';
export const TOGGLE_PROFILE_DIALOG = 'TOGGLE_PROFILE_DIALOG';

export const toggleLeftNav = () => {
  return {
    type: TOGGLE_LEFT_NAV
  };
}
export const toggleLoginDialog = () => {
  return {
    type: TOGGLE_LOGIN_DIALOG
  };
}
export const toggleProfileDialog = () => {
  return {
    type: TOGGLE_PROFILE_DIALOG
  };
}
export const leftNavPush = (to) => {
  return (dispatch) => {
    dispatch([
      toggleLeftNav(),
      push(to)
    ])
  };
}
