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
      wholeError: ''
    };

    this.state = {
      firebaseStore: FirebaseStore,
      isNavOpen: false,
      user: FirebaseStore.getUser(),
      loginDialog: this._cleanLoginDialog,
      isUserDialogOpen: false
    };

    this._onUserChange = this._onUserChange.bind(this);
  }
  componentWillMount() {
    FirebaseStore.on('user-changed', this._onUserChange);
  }
  componentWillUnmount() {
    FirebaseStore.off('user-changed', this._onUserChange);
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
    this.setLogiDialogState({
      email: e.target.value,
      emailError: ''
    });
  }
  onPasswordChange(e) {
    this.setLogiDialogState({
      password: e.target.value,
      passwordError: ''
    });
  }
  setLogiDialogState(state) {
    const newLoginDialogState = Object.assign({}, this.state.loginDialog, state);
    this.setState({
      loginDialog: newLoginDialogState
    });
  }
  onLogin() {
    const { firebaseStore, user, loginDialog: {email, password} } = this.state;
    if (user != null)
      return;
    var errors = false;
    if (isNullOrWhitespace(email)) {
      this.setLogiDialogState({
        emailError: 'Обязательное поле'
      });
      errors = true;
    }
    if (isNullOrWhitespace(password)) {
      this.setLogiDialogState({
        passwordError: 'Обязательное поле'
      });
      errors = true;
    }
    if (!errors)
    {
      this.setLogiDialogState({
        wholeError: ''
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

    this.setLogiDialogState({
        wholeError: ''
    });

    firebaseStore.logout(this.logoutCb.bind(this));
  }
  logoutCb(error, user) {

  }
  loginCb(error, user) {
    if (error)
    {
      this.setLogiDialogState({
        wholeError: error
      });
    } else {
      this.setState({
        loginDialog: this._cleanLoginDialog
      });
    }
  }
  toggleUserDialog()
  {
    this.setState({
      isUserDialogOpen: !this.state.isUserDialogOpen
    });
  }
  render() {
    const { content, title} = this.props;
    const { user, loginDialog, isUserDialogOpen } = this.state;
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
    const userDialog = user == null || user == 'load' //ProfileDialog
      ? <LoginDialog {...loginDialog} open={isUserDialogOpen} onRequestClose={this.toggleUserDialog.bind(this)} user={user} onEmailChange={this.onEmailChange.bind(this)} onPasswordChange={this.onPasswordChange.bind(this)} onLogin={this.onLogin.bind(this)} />
      : <ProfileDialog open={isUserDialogOpen} onRequestClose={this.toggleUserDialog.bind(this)} user={user} onLogout={this.onLogout.bind(this)}/>;
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
            <ListItemLink to='/files' onTouchTap={this.toggleLeftNav.bind(this)} primaryText="Файлы" />
          </List>
          <Divider />
          <List>
            <Subheader>Настройки</Subheader>
            <ListItemLink to='/users' onTouchTap={this.toggleLeftNav.bind(this)} primaryText="Пользователи" />
          </List>
          <Divider />
          <List>
            <Subheader>Пользователь</Subheader>
            <ListItem onTouchTap={this.toggleUserDialog.bind(this)} primaryText="Войти" />
          </List>
        </LeftNav>
        {/*<Tabs
          onChange={this.handleTabsChange.bind(this)}
          value={this.getCurrentTab.apply(this)}
          >
          <Tab value='journal' label='Журнал' />
          <Tab value='files' label='Файловый архив' />
          <Tab value='users' label='Управление пользователями' />
        </Tabs>*/}
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
