import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import layout from 'reducers/layoutReducer';
import loginPanel from 'reducers/loginPanelReducer';
import user from 'reducers/userReducer';
import firebaseService from 'reducers/firebaseServiceReducer';
import filepicker from 'reducers/filepickerReducer';
import files from 'reducers/filesReducer';
import userManager from 'reducers/userManagerReducer';

/*console.log({
  layout,
  loginPanel,
  user,
  routing,
  firebaseService
});*/

const rootReducer = combineReducers({
  layout,
  loginPanel,
  user,
  routing,
  firebaseService,
  files,
  filepicker,
  userManager
});

export default rootReducer;
