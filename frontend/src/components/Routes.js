import React from 'react';
import { Router, Route, IndexRedirect } from 'react-router';

import UsersPage from 'components/pages/users/UsersPage';
import JournalPage from 'components/pages/journal/JournalPage';
import FilesPage from 'components/pages/files/FilesPage';
import LayoutContainer from 'components/LayoutContainer'

const title = (title) => () => (
  <span>{title}</span>
);

const Routes = (
    <Route path="/" component={LayoutContainer}>
      <IndexRedirect to="/journal" />
      <Route
        path="/journal"
        components={{
          content: JournalPage,
          title: title('Журнал')
        }} />
      <Route
        path="/files"
        components={{
          content: FilesPage,
          title: title('Файлы')
        }} />
      <Route
        path="/users"
        components={{
          content: UsersPage,
          title: title('Управление пользователями')
        }} />
    </Route>
);

export default Routes;
