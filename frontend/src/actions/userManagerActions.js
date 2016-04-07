import keyMirror from 'keymirror';
import { isNullOrWhitespace } from 'utils/Utils';

export const ActionTypes = keyMirror({
  SET_USERMANAGER_SEARCH: null,
  SET_USERMANAGER_DIALOG: null
});

export const Actions = {
  setUsermanagerSearch: (search) => {
    return {
      type: ActionTypes.SET_USERMANAGER_SEARCH,
      playload: search
    };
  },

  setUsermanagerDialogState: (state) => {
    return {
      type: ActionTypes.SET_USERMANAGER_DIALOG,
      playload: state
    };
  }
}
