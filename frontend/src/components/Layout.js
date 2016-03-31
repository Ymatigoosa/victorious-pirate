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

import LoginDialog from 'components/LoginDialog'
import ProfileDialog from 'components/ProfileDialog'
import isNullOrWhitespace from 'utils/isNullOrWhitespace'
import config from 'config';

const ListItemLink = (props) => {
  const { to, leftNavPush, location } = props;
  return location.pathname.startsWith(to)
     ? <ListItem {...props} onTouchTap={null} style={{backgroundColor: "rgba(0, 0, 0, 0.2)"}} />
     : <ListItem {...props} onTouchTap={() => leftNavPush(to)} />
};

class Layout extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillMount() {

  }
  componentWillUnmount() {

  }
  isInRole(role) {
    return this.props.user.isInRole(role);
  }
  render() {
    //console.log('props', this.props);
    const {
      content,
      title,
      user,
      layout: {
        isLoginDialogOpen,
        isProfileDialogOpen,
        isNavOpen
      },
      loginPanel: {
        email,
        emailError,
        onEmailChange,
        password,
        passwordError,
        wholeLoginError
      },
      layoutActions: {
        toggleLeftNav,
        toggleLoginDialog,
        toggleProfileDialog,
        leftNavPush
      },
      loginPanelActions: {
        changeEmail,
        changePassword,
        cleanLogin,
        login,
        logout
      },
      userActions,
      routeActions,
    } = this.props;

    //const rightbtn = user == null
    //  ? (<FlatButton
    //    label='Войти'
    //    containerElement={<Link to='/login' />} />)
    //  : user == 'load'
    //    ? (<CircularProgress color='white' size={0.3} />)
    //    : (<FlatButton
    //      label='Профиль'
    //      containerElement={<Link to='/profile' />} />);
    const userDialog = !user.isLoggedIn()
      ? <LoginDialog
          email={email}
          emailError={emailError}
          onEmailChange={onEmailChange}
          password={password}
          passwordError={passwordError}
          wholeLoginError={wholeLoginError}
          open={isLoginDialogOpen}
          onRequestClose={toggleLoginDialog}
          user={user}
          onEmailChange={(e) => changeEmail(e.target.value)}
          onPasswordChange={(e) => changePassword(e.target.value)}
          onLogin={login} />
      : <ProfileDialog
          open={isProfileDialogOpen}
          onRequestClose={toggleProfileDialog}
          user={user.data}
          onLogout={logout} />;

    const profileBtn = user.data == null
      ? <ListItem onTouchTap={toggleLoginDialog} primaryText="Войти" />
      : user.data == 'load'
        ? <ListItem><CircularProgress size={0.3} /></ListItem>
        : <ListItem
            primaryText={user.data.email}
            onTouchTap={toggleProfileDialog}
            secondaryText={isNullOrWhitespace(user.data.fullname) ? '' :  user.data.fullname}
          />;

    const itemlintprops = {
      location: location,
      leftNavPush: leftNavPush
    };

    return (
      <div>
        <AppBar
          title={title}
          onLeftIconButtonTouchTap={toggleLeftNav} />
        <LeftNav
          width={200}
          open={isNavOpen}
          onRequestChange={toggleLeftNav}
          docked={false} >
          <AppBar title="Меню" iconElementLeft={<span></span>} />
          <List>
            <ListItemLink to='/journal' {...itemlintprops} primaryText="Журнал" />
            {this.isInRole(['clerk', 'admin']) ? <ListItemLink to='/files' {...itemlintprops} primaryText="Файлы" /> : null}
          </List>
          {this.isInRole('admin') ? (
            <div>
              <Divider />
              <List>
                <Subheader>Настройки</Subheader>
                <ListItemLink to='/users' {...itemlintprops} primaryText="Пользователи" />
              </List>
            </div>
          ) : null}
          <Divider />
          <List>
            <Subheader>Пользователь</Subheader>
            {profileBtn}
          </List>
        </LeftNav>
        <div style={{padding: '20px'}}>{content}</div>
        {userDialog}
        {
          (() => {
            if (config.appEnv === 'dev') {
              const DevTools = require('components/DevTools').default;
              //console.log(DevTools);
              return <DevTools />;
            }
          })()
        }
      </div>
    );
  }
}
Layout.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Layout;
