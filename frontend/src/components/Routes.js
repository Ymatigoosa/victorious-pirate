import React from 'react';
import { Router, Route, browserHistory, IndexRedirect } from 'react-router';

import UsersPage from 'components/pages/users/UsersPage';
import LoginPage from 'components/pages/users/LoginPage';
import JournalPage from 'components/pages/journal/JournalPage';
import FilesPage from 'components/pages/files/FilesPage';
import Layout from 'components/Layout'

const title = (title) => () => (
  <span>{title}</span>
);

const Routes = () => (
  <Router history={browserHistory}>
    <Route path="/" component={Layout}>
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
      <Route path="/login"
        components={{
          content: LoginPage,
          title: title('Вход')
        }} />
      <Route path="/profile"
        components={{
          content: LoginPage,
          title: title('Профиль')
        }} />
    </Route>
  </Router>
);

export default Routes;
