import { TOGGLE_LEFT_NAV, TOGGLE_LOGIN_DIALOG, TOGGLE_PROFILE_DIALOG } from 'actions/layoutActions';

const initialState = {
  isNavOpen: false,
  isLoginDialogOpen: false,
  isProfileDialogOpen: false
};

export function layout(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_LEFT_NAV:
      return {
        ...state,
        isNavOpen: !state.isNavOpen
      };

    case TOGGLE_LOGIN_DIALOG:
      return {
        ...state,
        isLoginDialogOpen: !state.isLoginDialogOpen
      };

    case TOGGLE_PROFILE_DIALOG:
      return {
        ...state,
        isProfileDialogOpen: !state.isProfileDialogOpen
      };

    default:
      return state;
  }
}
