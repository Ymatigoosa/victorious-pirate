import keyMirror from 'keyMirror';
import { deleteAllFromFirebase, isNullOrWhitespace } from 'utils/Utils';

export const ActionTypes = keyMirror({
  SET_CATTEGORY_SEARCH: null,
  SET_FILES_SEARCH: null,
  SET_CATEGORY_DIALOG: null,
  SET_FILE_UPLOAD_DIALOG: null
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

  saveCategoryFromDialog: ({
    itemKey,
    name,
    allowedForTeachers
  }) => (dispatch, getState) => {
    const {
      firebaseService
    } = getState();

    const newdata = {
      name,
      allowedForTeachers
    };
    if (!isNullOrWhitespace(itemKey)) {
      firebaseService.ref.child('document-categories').child(itemKey).set(newdata);
    } else {
      firebaseService.ref.child('document-categories').push(newdata);
    }

    
  },

  saveUploadedFileFromDialog: ({ itemKey, name, fpfile, categoryUid, isTemplate, templateUid }) => (dispatch, getState) => {
    const {
      firebaseService,
      filepicker
    } = getState();

    const newdata = {
      name,
      fpfile,
      categoryUid,
      templateUid,
      isTemplate
    };
    if (!isNullOrWhitespace(itemKey)) {
      firebaseService.ref.child('documents').child(itemKey).once('value', (snapshot) => {
        const { fpfile, templateUid } = snapshot.val();
        if (isNullOrWhitespace(templateUid)) {
          filepicker.remove(fpfile);
        }
        firebaseService.ref.child('documents').child(itemKey).set(newdata);
      });
    } else {
      firebaseService.ref.child('documents').push(newdata);
    }

    //dispatch(Actions.setFileUploadDialogState(null));
  },

  deleteCategory: (itemKey) => (dispatch, getState) => {
    const { filepicker, firebaseService } = getState();
    const root = firebaseService.ref;
    root.child('documents').orderByChild('categoryUid').equalTo(itemKey).once('value', (snapshot) => {
      deleteAllFromFirebase(snapshot, (item) => {
        const { fpfile } = item;
        filepicker.remove(fpfile);
      });
    });
    root.child('document-categories').child(itemKey).remove();
  },

  deleteFile: (itemKey, fpfile) => (dispatch, getState) => {
    const { filepicker, firebaseService } = getState();
    const root = firebaseService.ref;
    root.child('documents').child(itemKey).remove();
    filepicker.remove(fpfile);
  }
}
