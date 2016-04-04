import { keyMirror } from 'keyMirror';

export const ActionTypes = keyMirror({
  SET_CATTEGORY_SEARCH: null,
  SET_FILES_SEARCH: null,
  SET_CATEGORY_CREATE_DIALOG: null,
  SET_FILE_UPLOAD_DIALOG: null,
  SET_FILE_CREATE_BY_TEMPLATE_DIALOG: null,
  SET_FILE_UPLOAD_TEMPLATE: null,
});

export const Actions = {
  setCategorySearch: (search) => ({
    type: SET_CATTEGORY_SEARCH,
    playload: search
  }),

  setFilesSearch: (search) => ({
    type: SET_FILES_SEARCH,
    playload: search
  }),

  setCategoryCreateDialogState: (playload) => ({
    type: SET_CATTEGORY_SEARCH,
    playload: playload
  }),

  setFileUploadDialogState: (playload) => ({
    type: SET_FILE_UPLOAD_DIALOG,
    playload: playload
  }),

  setFileCreateByTemplateState: (playload) => ({
    type: SET_FILE_CREATE_BY_TEMPLATE_DIALOG,
    playload: playload
  }),

  setFileUploadTemplateDialogState: (playload) => ({
    type: SET_FILE_UPLOAD_TEMPLATE,
    playload: playload
  })

}
