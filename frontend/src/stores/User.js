export default class User {
  constructor(props) {
    this.data = props;
  }
  isLoggedIn() {
    return this.data != null && this.data != 'load';
  }
  isInRole(role) {
    if (Array.isArray(role)) {
      return role.reduce((a, b) => a || this.isInRole(b), false);
    } else {
      return this.data != null
        && this.data != 'load'
        && this.data.roles[role] != void 0
        && this.data.roles[role] != null;
    }
  }
}
