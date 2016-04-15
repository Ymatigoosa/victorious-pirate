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

class Layout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      count: 1
    }
  }

  onClick() {
    this.setState({
      count: this.state.count+1
    });
  }

  render() {

    return (
      <div>
        <AppBar
          className='Layout-header'
          style={{position: 'fixed'}}
          title={this.props.title+this.state.count}
          onLeftIconButtonTouchTap={this.onClick.bind(this)} />
      </div>
    );
  }
}
Layout.contextTypes = {
  muiTheme: React.PropTypes.object
};

export default Layout;
