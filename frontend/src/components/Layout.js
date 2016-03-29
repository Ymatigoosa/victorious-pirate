require('styles/App.scss');
import React from 'react';
import { Link } from 'react-router';

import AppBar from 'material-ui/lib/app-bar';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import FlatButton from 'material-ui/lib/flat-button';
import FontIcon from 'material-ui/lib/font-icon';
import Paper from 'material-ui/lib/paper';
import CircularProgress from 'material-ui/lib/circular-progress';
import LeftNav from 'material-ui/lib/left-nav';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Divider from 'material-ui/lib/divider';
import Subheader from 'material-ui/lib/Subheader';
import Avatar from 'material-ui/lib/avatar';
import Person from 'material-ui/lib/svg-icons/social/person';

import FirebaseStore from 'stores/FirebaseStore';
import LoginDialog from 'components/LoginDialog'
import ProfileDialog from 'components/ProfileDialog'

const ListItemLink = (props, context) => {
  const { to, onTouchTap } = props;
  const { router } = context;
  const enchantedOnTouchTap = (e) => {
   router.push(to);
   onTouchTap(e);
  };
  return router.isActive(to)
     ? <ListItem {...props} onTouchTap={null} style={{backgroundColor: "rgba(0, 0, 0, 0.2)"}} />
     : <ListItem {...props} onTouchTap={enchantedOnTouchTap} />
};
ListItemLink.contextTypes = {
  router: React.PropTypes.object.isRequired
};

const isNullOrWhitespace = ( str ) => {
    if (typeof str === 'undefined' || str == null)
      return true;

    return str.replace(/\s/g, '').length < 1;
}

class Layout extends React.Component {
  constructor(props) {
    super(props);
    this._cleanLoginDialog = {
      email: '',
      emailError: '',
      password: '',
      passwordError: '',
      wholeLoginError: ''
    };

    this.state = Object.assign({}, this._cleanLoginDialog, {
      firebaseStore: FirebaseStore,
      isNavOpen: false,
      user: FirebaseStore.getUser(),
      isLoginDialogOpen: false,
      isProfileDialogOpen: false
    });

    this._onUserChange = this._onUserChange.bind(this);
  }
  componentWillMount() {
    this.state.firebaseStore.on('user-changed', this._onUserChange);
  }
  componentWillUnmount() {
    this.state.firebaseStore.off('user-changed', this._onUserChange);
  }
  _onUserChange (user) {
    this.setState({
      user: user
    });
  }
  toggleLeftNav() {
    this.setState({
      isNavOpen: !this.state.isNavOpen
    });
  }
  onEmailChange(e) {
    this.setState({
      email: e.target.value,
      emailError: ''
    });
  }
  onPasswordChange(e) {
    this.setState({
      password: e.target.value,
      passwordError: ''
    });
  }
  onLogin() {
    const { firebaseStore, user, email, password } = this.state;
    if (user != null)
      return;
    var errors = false;
    if (isNullOrWhitespace(email)) {
      this.setState({
        emailError: 'Обязательное поле'
      });
      errors = true;
    }
    if (isNullOrWhitespace(password)) {
      this.setState({
        passwordError: 'Обязательное поле'
      });
      errors = true;
    }
    if (!errors)
    {
      this.setState({
        wholeLoginError: ''
      });

      firebaseStore.loginWithPW({
        'email': email,
        'password': password
      }, this.loginCb.bind(this));
    }
  }
  onLogout() {
    //console.log(123);
    const { firebaseStore, user } = this.state;
    if (user == null)
      return;

    firebaseStore.logout(this.logoutCb.bind(this));
  }
  logoutCb(error, user) {
    toggleProfileDialog();
  }
  loginCb(error, user) {
    if (error) {
      this.setState({
        wholeLoginError: error
      });
    } else {
      this.setState(this._cleanLoginDialog);
      this.toggleLoginDialog();
    }
  }
  toggleLoginDialog() {
    this.setState({
      isLoginDialogOpen: !this.state.isLoginDialogOpen
    });
  }
  toggleProfileDialog() {
    this.setState({
      isProfileDialogOpen: !this.state.isProfileDialogOpen
    });
  }
  isInRole(role) {
    return this.state.firebaseStore.isInRole(role);
  }
  render() {
    const {
      content,
      title
    } = this.props;
    const {
      user,
      loginDialog,
      isLoginDialogOpen,
      isProfileDialogOpen,
      email,
      emailError,
      onEmailChange,
      password,
      passwordError,
      wholeLoginError
    } = this.state;
    const { router } = this.context;

    const contentWithProps = React.cloneElement(content, {
      firebaseStore: this.state.firebaseStore,
      user: this.state.user
    });
    //const rightbtn = user == null
    //  ? (<FlatButton
    //    label='Войти'
    //    containerElement={<Link to='/login' />} />)
    //  : user == 'load'
    //    ? (<CircularProgress color='white' size={0.3} />)
    //    : (<FlatButton
    //      label='Профиль'
    //      containerElement={<Link to='/profile' />} />);
    const userDialog = user == null || user == 'load'
      ? <LoginDialog
          email={email}
          emailError={emailError}
          onEmailChange={onEmailChange}
          password={password}
          passwordError={passwordError}
          wholeLoginError={wholeLoginError}
          open={isLoginDialogOpen}
          onRequestClose={this.toggleLoginDialog.bind(this)}
          user={user}
          onEmailChange={this.onEmailChange.bind(this)}
          onPasswordChange={this.onPasswordChange.bind(this)}
          onLogin={this.onLogin.bind(this)} />
      : <ProfileDialog
          open={isProfileDialogOpen}
          onRequestClose={this.toggleProfileDialog.bind(this)}
          user={user} onLogout={this.onLogout.bind(this)} />;

    const profileBtn = user == null
      ? <ListItem onTouchTap={this.toggleLoginDialog.bind(this)} primaryText="Войти" />
      : user == 'load'
        ? <ListItem><CircularProgress size={0.3} /></ListItem>
        : <ListItem
            primaryText={user.email}
            secondaryText={isNullOrWhitespace(user.fullname) ? '' :  user.fullname}
            onTouchTap={this.toggleProfileDialog.bind(this)} />;

    return (
      <div>
        <AppBar
          title={title}
          onLeftIconButtonTouchTap={this.toggleLeftNav.bind(this)} />
        <LeftNav
          width={200}
          open={this.state.isNavOpen}
          onRequestChange={this.toggleLeftNav.bind(this)}
          docked={false} >
          <AppBar title="Меню" iconElementLeft={<span></span>} />
          <List>
            <ListItemLink to='/journal' onTouchTap={this.toggleLeftNav.bind(this)} primaryText="Журнал" />
            {this.isInRole(['clerk', 'admin']) ? <ListItemLink to='/files' onTouchTap={this.toggleLeftNav.bind(this)} primaryText="Файлы" /> : null}
          </List>
          {this.isInRole('admin') ? (
            <div>
              <Divider />
              <List>
                <Subheader>Настройки</Subheader>
                <ListItemLink to='/users' onTouchTap={this.toggleLeftNav.bind(this)} primaryText="Пользователи" />
              </List>
            </div>
          ) : null}
          <Divider />
          <List>
            <Subheader>Пользователь</Subheader>
            {profileBtn}
          </List>
        </LeftNav>
        <div style={{padding: '20px'}}>{contentWithProps}</div>
        {userDialog}
      </div>
    );
  }
}
Layout.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Layout;
