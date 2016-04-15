require('styles/App.scss');
import React from 'react';
import { Link } from 'react-router';

import AppBar from 'material-ui/lib/app-bar';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
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
import * as Colors from 'material-ui/lib/styles/colors';

import LoginDialog from 'components/LoginDialog'
import ProfileDialog from 'components/ProfileDialog'
import { isNullOrWhitespace } from 'utils/Utils'
import config from 'config';

const ListItemLink = (props, context) => {
  //console.log(context);
  const { to, leftNavPush, location } = props;
  return location.pathname.startsWith(to)
     ? <ListItem {...props} onTouchTap={null} style={{color: context.muiTheme.rawTheme.palette.accent1Color}} />
     : <ListItem {...props} onTouchTap={() => leftNavPush(to)} />
};
ListItemLink.contextTypes = {
  muiTheme: React.PropTypes.object.isRequired
};

const avatarsyle = {
  marginBottom:'15px'
};
const papersontentstyle = {
  display: 'flex',
  flex: '1 0 auto',
  flexDirection: 'column',
  padding: 0,
  width: '100%',
  maxWidth: '960px'
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
      children,
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
      location
    } = this.props;

    const title = location.pathname.startsWith('/journal')
      ? 'Журнал'
      : location.pathname.startsWith('/files')
        ? 'Файлы'
        : location.pathname.startsWith('/users')
          ? 'Управление пользователями'
          : 'Неизвестная страница';

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
          onLogin={() => login()} >
            <div>
              <RaisedButton label="admin" onTouchTap={() => login({email: 'admin@admin.com', password: 'admin'})} />
              <RaisedButton label="clerk" onTouchTap={() => login({email: 'clerk@clerk.com', password: 'clerk'})} />
              <RaisedButton label="teacher" onTouchTap={() => login({email: 'teacher@teacher.com', password: 'teacher'})} />
            </div>
          </LoginDialog>
      : <ProfileDialog
          open={isProfileDialogOpen}
          onRequestClose={toggleProfileDialog}
          user={user.data}
          onLogout={logout} />;


    const profileBtn = user.data == null
      ? <ListItem onTouchTap={toggleLoginDialog} primaryText="Войти" ><Avatar style={avatarsyle} icon={<Person />} /></ListItem>
      : user.data == 'load'
        ? <ListItem><CircularProgress size={0.3} /></ListItem>
        : <ListItem
            primaryText={user.data.email}
            onTouchTap={toggleProfileDialog}
            secondaryText={isNullOrWhitespace(user.data.fullname) ? '' :  user.data.fullname}
          ><Avatar style={avatarsyle} backgroundColor={Colors.green400} icon={<Person  />} /></ListItem>;

    const listitemlinkprops = {
      location: location,
      leftNavPush: leftNavPush
    };

    return (
      <div>
      <AppBar
        className='Layout-header'
        style={{position: 'fixed'}}
        title={title}
        onLeftIconButtonTouchTap={toggleLeftNav} />
        <div className='Layout'>
          <LeftNav
            width={200}
            open={isNavOpen}
            onRequestChange={toggleLeftNav}
            docked={false} >
            <List>
              <div style={{textAlign: 'center', marginTop: '-8px', backgroundColor: Colors.grey100 }}>{profileBtn}</div>
              <Divider />
              <Subheader>Меню</Subheader>
              <ListItemLink to='/journal' {...listitemlinkprops} primaryText="Журнал" />
              {this.isInRole(['clerk', 'admin']) ? <ListItemLink to='/files' {...listitemlinkprops} primaryText="Файлы" /> : null}
              {this.isInRole('admin') ? (
                <div>
                  <Divider />
                    <Subheader>Настройки</Subheader>
                    <ListItemLink to='/users' {...listitemlinkprops} primaryText="Пользователи" />
                </div>
              ) : null}
            </List>
          </LeftNav>
          <div className='Layout-body' >
              {children}
          </div>
          {/*<div className='Layout-footer'>
            {'футер'}
          </div>*/}
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
      </div>
    );
  }
}
Layout.contextTypes = {
  muiTheme: React.PropTypes.object
};

export default Layout;
