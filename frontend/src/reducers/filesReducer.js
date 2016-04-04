import { ActionTypes } from 'actions/filesActions';

const {
  SET_CATTEGORY_SEARCH,
  SET_FILES_SEARCH,
  SET_CATEGORY_CREATE_DIALOG,
  SET_FILE_UPLOAD_DIALOG,
  SET_FILE_CREATE_BY_TEMPLATE_DIALOG,
  SET_FILE_UPLOAD_TEMPLATE_DIALOG
} = ActionTypes;

const initialState = {
  category_search: '',
  files_search: '',
  categoryCreateDialog: {
    state: 'hide',
    name: '',
    description: '',
    allowedForTeachers: false
  }
  fileUploadDialog: {
    state: 'hide',
    name: ''
  },
  fileCreateByTemplateDialog: {
    state: 'hide',
    templateUid: ''
  },
  fileUploadTemplateDialog: {
    state: 'hide',
    name: ''
  },
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

  [SET_CATEGORY_CREATE_DIALOG]: (state, action) => ({
    ...state,
    fileUploadDialog: {
      ...state.fileUploadDialog,
      ...action.playload
    }
  }),

  [SET_FILE_UPLOAD_DIALOG]: (state, action) => ({
    ...state,
    categoryCreateDialog: {
      ...state.categoryCreateDialog,
      ...action.playload
    }
  }),

  [SET_FILE_CREATE_BY_TEMPLATE_DIALOG]: (state, action) => ({
    ...state,
    fileCreateByTemplateDialog: {
      ...state.fileCreateByTemplateDialog,
      ...action.playload
    }
  }),

  [SET_FILE_UPLOAD_TEMPLATE_DIALOG]: (state, action) => ({
    ...state,
    fileUploadTemplateDialog: {
      ...state.fileUploadTemplateDialog,
      ...action.playload
    }
  })

});
