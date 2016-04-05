import { keyMirror } from 'keyMirror';
import { deleteAllFromFirebase } from 'utils/Utils';

export const ActionTypes = keyMirror({
  SET_CATTEGORY_SEARCH: null,
  SET_FILES_SEARCH: null,
  SET_CATEGORY_CREATE_DIALOG: null,
  SET_FILE_UPLOAD_DIALOG: null,
  SET_FILE_CREATE_BY_TEMPLATE_DIALOG: null
});

export const Actions = {
  setCategorySearch: (search) => ({
    type: ActionTypes.SET_CATTEGORY_SEARCH,
    playload: search
  }),

  setFilesSearch: (search) => ({
    type: ActionTypes.SET_FILES_SEARCH,
    playload: search
  }),

  setCategoryDialogState: (playload) => ({
    type: ActionTypes.SET_CATEGORY_DIALOG,
    playload: playload
  }),

  setFileUploadDialogState: (playload) => ({
    type: ActionTypes.SET_FILE_UPLOAD_DIALOG,
    playload: playload
  }),

  setFileCreateByTemplateState: (playload) => ({
    type: ActionTypes.SET_FILE_CREATE_BY_TEMPLATE_DIALOG,
    playload: playload
  }),

  saveCategoryFromDialog: () => (dispatch, getState) => {
    const {
      firebaseService,
      files: {
        categoryCreateDialog: {
          key,
          name,
          description,
          allowedForTeachers
        }
      }
    } = getState();

    const newdata = {
      name,
      description,
      allowedForTeachers
    };
    if (key !== null && key !== void 0) {
      firebaseService.ref.child('document-categories').child(key).set(newdata);
    } else {
      firebaseService.ref.child('document-categories').push(newdata);
    }

    dispatch(Actions.setCategoryCreateDialogState(null));
  },

  saveUploadedFileFromDialog: ({ key, name, fpfile, categoryUid, isTemplate }) => (dispatch, getState) => {
    const {
      firebaseService
    } = getState();

    const newdata = {
      name,
      fpfile,
      categoryUid,
      isTemplate
    };
    if (key !== null && key !== void 0) {
      firebaseService.ref.child('documents').child(key).set(newdata);
    } else {
      firebaseService.ref.child('documents').push(newdata);
    }

    dispatch(Actions.setFileUploadDialogState(null));
  },

  saveFileFromTemplateDialog: ({ key, name, categoryUid, templateUid }) => (dispatch, getState) => {
    const {
      firebaseService
    } = getState();

    firebaseService.ref.child.child('documents').child(templateUid).once('value', (snapshot) => {
      const { downloadUrl, readUrl } = snapshot.val();

      const newdata = {
        name,
        downloadUrl,
        categoryUid,
        readUrl,
        isTemplate: false
      };
      if (key !== null && key !== void 0) {
        firebaseService.ref.child('documents').child(key).set(newdata);
      } else {
        firebaseService.ref.child('documents').push(newdata);
      }
    });

  },

  deleteCategory: (key) => (dispatch, getState) => {
    const root = this.props.firebaseService.ref;
    root.child('documents').orderByChild('categoryUid').equalTo(key).once('value', deleteAllFromFirebase);
    root.child('document-categories').child(key).remove();
    this.writeRef.child(key).remove();
  },

  deleteFile: (key) => (dispatch, getState) => {
    const root = this.props.firebaseService.ref;
    root.child('documents').child(key).remove();
    this.writeRef.child(key).remove();
  }
}
