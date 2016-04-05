import { ActionTypes } from 'actions/filesActions';
import { createReducer } from 'utils/Utils';

const {
  SET_CATTEGORY_SEARCH,
  SET_FILES_SEARCH,
  SET_CATEGORY_DIALOG,
  SET_FILE_UPLOAD_DIALOG,
  SET_FILE_CREATE_BY_TEMPLATE_DIALOG
} = ActionTypes;

const initialState = {
  category_search: '',
  files_search: '',
  categoryDialog: {
    key: '',
    state: 'hide',
    name: '',
    description: '',
    allowedForTeachers: false
  },
  fileUploadDialog: {
    key: '',
    state: 'hide',
    name: '',
    fpfile: {},
    categoryUid: '',
    isTemplate: false
  },
  fileCreateByTemplateDialog: {
    key: '',
    state: 'hide',
    name: '',
    categoryUid: '',
    templateUid: ''
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
  }),

  [SET_FILE_CREATE_BY_TEMPLATE_DIALOG]: (state, action) => ({
    ...state,
    fileCreateByTemplateDialog: action.playload == null ? initialState.fileCreateByTemplateDialog : {
      ...state.fileCreateByTemplateDialog,
      ...action.playload
    }
  })

});
