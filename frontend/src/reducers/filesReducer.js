import { ActionTypes } from 'actions/filesActions';
import { createReducer } from 'utils/Utils';

const {
  SET_CATTEGORY_SEARCH,
  SET_FILES_SEARCH,
  SET_CATEGORY_DIALOG,
  SET_FILE_UPLOAD_DIALOG,
  SET_SNACKBAR_STATE
} = ActionTypes;

const initialState = {
  category_search: '',
  files_search: '',
  categoryDialog: {
    itemKey: '',
    state: 'hide',
    name: '',
    allowedForTeachers: false
  },
  fileUploadDialog: {
    showTemplates: false,
    itemKey: '',
    state: 'hide',
    name: '',
    fpfile: {},
    categoryUid: '',
    templateUid: '',
    isTemplate: false
  },
  snackbar: {
    text: '',
    isOpen: false
  }
};

export default createReducer(initialState, {
  [SET_CATTEGORY_SEARCH]: (state, action) => ({
    ...state,
    category_search: action.playload
  }),

  [SET_FILES_SEARCH]: (state, action) => ({
    ...state,
    files_search: action.playload
  }),

  [SET_SNACKBAR_STATE]: (state, action) => ({
    ...state,
    snackbar: {...state.snackbar, ...action.playload}
  }),

  [SET_FILE_UPLOAD_DIALOG]: (state, action) => ({
    ...state,
    fileUploadDialog: action.playload == null ? initialState.fileUploadDialog : {
      ...state.fileUploadDialog,
      ...action.playload
    }
  }),

  [SET_CATEGORY_DIALOG]: (state, action) => ({
    ...state,
    categoryDialog: action.playload == null ? initialState.categoryDialog : {
      ...state.categoryDialog,
      ...action.playload
    }
  })

});
