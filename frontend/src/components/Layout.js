require('styles/App.scss');
import React from 'react';
import { Link } from 'react-router';
import AppBar from 'material-ui/lib/app-bar';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import FlatButton from 'material-ui/lib/flat-button';
import FontIcon from 'material-ui/lib/font-icon';
import Paper from 'material-ui/lib/paper';
import FirebaseStore from 'stores/FirebaseStore';
import CircularProgress from 'material-ui/lib/circular-progress';
import LeftNav from 'material-ui/lib/left-nav';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Divider from 'material-ui/lib/divider';
import Subheader from 'material-ui/lib/Subheader';

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
  router: React.PropTypes.func.isRequired
};

class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firebaseStore: FirebaseStore,
      isNavOpen: false,
      user: FirebaseStore.getUser()
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
  getCurrentPage() {
    const { router } = this.context;
    if (router.isActive('/journal'))
      return 'journal';
    if (router.isActive('/files'))
        return 'files';
    if (router.isActive('/users'))
        return 'users';

    return '';
  }
  handleTabsChange(value) {
    this.context.router.push(`/${value}`);
  }
  onLogout() {
    //console.log(123);
    const { firebaseStore } = this.state;

    firebaseStore.logout(() => this.context.router.push('/'));
  }
  toggleLeftNav() {
    this.setState({
      isNavOpen: !this.state.isNavOpen
    });
  }
  render() {
    const { content, title} = this.props;
    const { user } = this.state;
    const { router } = this.context;

    const contentWithProps = React.cloneElement(content, {
      firebaseStore: this.state.firebaseStore,
      user: this.state.user
    });
    const rightbtn = user == null
      ? (<FlatButton
        label='Войти'
        containerElement={<Link to='/login' />} />)
      : user == 'load'
        ? (<CircularProgress color='white' size={0.3} />)
        : (<FlatButton
          label='Профиль'
          containerElement={<Link to='/profile' />} />);
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
            <ListItem primaryText="Войти" />
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
      </div>
    );
  }
}
Layout.contextTypes = {
  router: React.PropTypes.func.isRequired
};

export default Layout;
