require('normalize.css');
require('styles/App.scss');

import React from 'react';

import AppBar from 'material-ui/lib/app-bar';

const AppBarExampleIcon = () => (
  <AppBar
    title="React Material Dashboard"
    iconClassNameRight="muidocs-icon-navigation-expand-more"
  />
);

export default AppBarExampleIcon;
