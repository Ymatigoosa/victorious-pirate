import Firebase from 'firebase';
import EventEmitter from 'eventemitter3';

const genErrorMsg = (e) => {
  var message = ''
  switch ( e.code) {
    case 'AUTHENTICATION_DISABLED':
      message = 'The requested authentication provider is disabled for this Firebase application.'
      break;
    case 'EMAIL_TAKEN':
      message = 'The new user account cannot be created because the specified email address is already in use.'
      break;
    case 'INVALID_ARGUMENTS':
      message = 'The specified credentials are malformed or incomplete. Please refer to the error message, error details, and Firebase documentation for the required arguments for authenticating with this provider.'
      break;
    case 'INVALID_CONFIGURATION':
      message = 'The requested authentication provider is misconfigured, and the request cannot complete. Please confirm that the provider\'s client ID and secret are correct in your App Dashboard and the app is properly set up on the provider\'s website.'
      break;
    case 'INVALID_EMAIL':
      message = 'The specified email is not a valid email.'
      break;
    case 'INVALID_ORIGIN':
      message = 'A security error occurred while processing the authentication request. The web origin for the request is not in your list of approved request origins. To approve this origin, visit the Login & Auth tab in your App Dashboard.'
      break;
    case 'INVALID_PROVIDER':
      message = 'The requested authentication provider does not exist. Please consult the Firebase Authentication documentation for a list of supported providers.'
      break;
    case 'INVALID_TOKEN':
      message = 'The specified authentication token is invalid. This can occur when the token is malformed, expired, or the Firebase app secret that was used to generate it has been revoked.'
      break;
    case 'INVALID_CREDENTIALS':
      /* message = 'The specified authentication credentials are invalid. This may occur when credentials are malformed or expired.' */
      /* fallthrough */
    case 'INVALID_USER':
      /* message = 'The specified user account does not exist.' */
      /* fallthrough */
    case 'INVALID_PASSWORD':
       message = 'The specified user login or password is incorrect.'
      break;
    case 'NETWORK_ERROR':
      message = 'An error occurred while attempting to contact the authentication server. Please check your internet connection.'
      break;
    case 'PROVIDER_ERROR':
      message = 'A third-party provider error occurred. Please refer to the error message and error details for more information.'
      break;
    case 'TRANSPORT_UNAVAILABLE':
      message = 'The requested login method is not available in the user\'s browser environment. Popups are not available in Chrome for iOS, iOS Preview Panes, or local, file:// URLs. Redirects are not available in PhoneGap / Cordova, or local, file:// URLs.'
      break;
    case 'USER_CANCELLED':
      message = 'The current authentication request was cancelled by the user.'
      break;
    case 'USER_DENIED':
      message = 'The user did not authorize the application. This error can occur when the user has cancelled an OAuth authentication request.'
      break;
    case 'UNKNOWN_ERROR':
      message = 'An unknown error occurred. Please refer to the error message and error details for more information.'
      /* Fall through */
    default:
      message = 'Unknown error occured'
      break;
  }
  return message;
}

class FirebaseStore extends EventEmitter {
  constructor(url) {
    super();
    this.ref = new Firebase(url);
    this.cachedUser = null;

    const authData = this.ref.getAuth();
    if (authData != null)
    {
      this._setUser('load');
      this._getUserFromFirebase(authData.uid, function (snap) {
        this._setUser(snap.val());
        //console.log('initial data loaded!', Object.keys(snap.val()).length === count);
      }.bind(this));
    }
  }
  getRef() {
    return this.ref;
  }
  getUser() {
    return this.cachedUser;
  }
  createUser({email, password, fullname, about, roles}, cb) {
    this.ref.createUser({email: email, password: password}, function(err, authData) {
      if (err) {
        var message = genErrorMsg(err);
        console.error(message);
        cb(message);
      } else {
          const newuser = {
            email: email,
            uid: authData.uid,
            fullname: fullname,
            about: about,
            roles: roles || {}
          };
          this._addNewUserToFirabase(newuser);
          cb && cb(false, newuser);
      }
    }.bind(this));
  }
  loginWithPW(userObj, cb){
    this._setUser('load');
    this.ref.authWithPassword(userObj, function(err, authData) {
      if (err) {
        var message = genErrorMsg(err);
        cb && cb(message);
        console.error(message);
        this._setUser(null);
      } else {
        this._getUserFromFirebase(authData.uid, function (snap) {
          this._setUser(snap.val());
          cb && cb(false, this.getUser());
          //console.log('initial data loaded!', Object.keys(snap.val()).length === count);
        }.bind(this));
      }
    }.bind(this));
  }
  isLoggedIn(){
    return this.cachedUser != null && this.cachedUser != 'load';
  }
  isInRole(role){
    return this.cachedUser != null
      && this.cachedUser != 'load'
      && this.cachedUser.roles[role] != void 0
      && this.cachedUser.roles[role] != null;
  }
  logout(cb){
    this.ref.unauth();
    this._setUser(null);
    this.cachedUser = null;
    cb && cb(false);
  }
  _addNewUserToFirabase (newUser) {
    var key = newUser.uid;
    this.ref.child('users').child(key).set(newUser);
  }
  _getUserFromFirebase (uid, cb) {
    this.ref.child('users').child(uid).once('value', cb);
  }
  _setUser (user) {
    this.cachedUser = user;
    this.emit('user-changed', this.cachedUser);
  }
};

const SINGLETON = new FirebaseStore('https://victorious-pirate.firebaseio.com');

export default SINGLETON;
