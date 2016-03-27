require('styles/App.scss');
import React from 'react';
import { Link } from 'react-router';
import AppBar from 'material-ui/lib/app-bar';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import FlatButton from 'material-ui/lib/flat-button';
import FontIcon from 'material-ui/lib/font-icon';

const iconStyles = {
  marginRight: 10,
};

class Layout extends React.Component {
  constructor(props) {
    super(props);
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
  render() {
    const { content, title} = this.props;
    return (
      <div>
        <AppBar
          title={title}
          iconElementLeft={<span></span>}
          iconElementRight={
            <FlatButton label='Войти' containerElement={<Link to='/login' />} />
          } />
        <Tabs
          onChange={this.handleTabsChange.bind(this)}
          value={this.getCurrentTab.apply(this)}
          >
          <Tab value='journal' label='Журнал' />
          <Tab value='files' label='Файловый архив' />
          <Tab value='users' label='Управление пользователями' />
        </Tabs>
        <div style={{padding: '20px'}}>{content}</div>
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
