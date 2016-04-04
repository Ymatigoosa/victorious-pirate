export const SET_USER = 'SET_USER';
export const SET_USER_LOAD = 'SET_USER_LOAD';
export const CLEAN_USER = 'SET_USER';

export function setUser(user) {
  return {
    type: SET_USER,
    playload: user
  };
}

export function setUserLoad() {
  return {
    type: SET_USER_LOAD
  };
}

export function cleanUser() {
  return {
    type: CLEAN_USER
  };
}
