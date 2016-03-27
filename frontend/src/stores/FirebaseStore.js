import Firebase from 'firebase';

const forge = 'https://victorious-pirate.firebaseio.com';
const ref = new Firebase(forge);

// global user object
// todo: make not global
var cachedUser = null;

const addNewUserToFirabase = (newUser) => {
  var key = newUser.uid;
  ref.child('users').child(key).set(newUser);
};

const getUser = (uid, cb) => {
  ref.child('users').child(uid).once('value', cb);
};

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

const FirebaseStore = {
  createUser: function({email, password, fullname, about, roles}, cb) {
    ref.createUser({email: email, password: password}, function(err, authData) {
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
          addNewUserToFirabase(newuser);
          cb && cb(false, newuser);
      }
    }.bind(this));
  },
  loginWithPW: function(userObj, cb){
    ref.authWithPassword(userObj, function(err, authData){
      if (err) {
        var message = genErrorMsg(err);
        cb && cb(message);
        console.error(message);
      } else {
        getUser(authData.uid, function(snap) {
          cachedUser = snap.val();
          cb && cb(false, cachedUser);
          //console.log('initial data loaded!', Object.keys(snap.val()).length === count);
        });
      }
    }.bind(this));
  },
  isLoggedIn: function(){
    return cachedUser != null;
  },
  isInRole: function(role){
    return cachedUser != null
      && cachedUser.roles[role] != void 0
      && cachedUser.roles[role] != null;
  },
  logout: function(cb){
    ref.unauth();
    cachedUser = null;
    cb && cb(false);
  },
  ref: ref
};

export default FirebaseStore;
