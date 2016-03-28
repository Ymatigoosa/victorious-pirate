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

const iconStyles = {
  marginRight: 10
};

class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firebaseStore: FirebaseStore,
      user: FirebaseStore.getUser()
    };

    FirebaseStore.on('user-changed', (user) => {
      this.setState({
        user: user
      });
    })
  }
  getCurrentTab() {
    const router = this.context.router;
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

    firebaseStore.logout(() => this.context.router.push(`/`));
  }
  render() {
    const { content, title} = this.props;
    const { user } = this.state;
    const contentWithProps = React.cloneElement(content, {
      firebaseStore: this.state.firebaseStore,
      user: this.state.user
    })
    const rightbtn = user == null
      ? (<FlatButton
        label='Войти'
        containerElement={<Link to='/login' />} />)
      : user == 'load'
        ? (<CircularProgress color='white' size={0.3} />)
        : (<FlatButton
            label='Выйти'
            onMouseUp={this.onLogout.bind(this)} />);
    return (
      <div>
        <Paper zDepth={2}>
        <AppBar
          title={title}
          iconElementLeft={<span></span>}
          iconElementRight={rightbtn} />
        <Tabs
          onChange={this.handleTabsChange.bind(this)}
          value={this.getCurrentTab.apply(this)}
          >
          <Tab value='journal' label='Журнал' />
          <Tab value='files' label='Файловый архив' />
          <Tab value='users' label='Управление пользователями' />
        </Tabs>
        </Paper>
        <div style={{padding: '20px'}}>{contentWithProps}</div>
      </div>
    );
  }
}
Layout.contextTypes = {
  router: function () {
    return React.PropTypes.func.isRequired;
  }
};

export default Layout;
