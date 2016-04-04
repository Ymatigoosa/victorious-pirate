import { TOGGLE_LEFT_NAV, TOGGLE_LOGIN_DIALOG, TOGGLE_PROFILE_DIALOG } from 'actions/layoutActions';
import { createReducer } from 'utils/Utils';

const initialState = {
  isNavOpen: false,
  isLoginDialogOpen: false,
  isProfileDialogOpen: false
};

export default createReducer(initialState, {
  [TOGGLE_LEFT_NAV]: (state, action) => ({
    ...state,
    isNavOpen: !state.isNavOpen
  }),

  [TOGGLE_LOGIN_DIALOG]: (state, action) => ({
    ...state,
    isLoginDialogOpen: !state.isLoginDialogOpen
  }),

  [TOGGLE_PROFILE_DIALOG]: (state, action) => ({
    ...state,
    isProfileDialogOpen: !state.isProfileDialogOpen
  })

});
