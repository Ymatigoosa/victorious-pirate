import React from 'react';
import { Router, Route, IndexRedirect, IndexRoute } from 'react-router';

import UsersPage from 'components/pages/users/UsersPage';
import JournalPage from 'components/pages/journal/JournalPage';
import Terms from 'components/pages/journal/Terms';
import Courses from 'components/pages/journal/Courses';
import FilesPage from 'components/pages/files/FilesPage';
import LayoutContainer from 'components/LayoutContainer';

//academicTermUid

const Routes = (
    <Route path="/" component={LayoutContainer}>
      <IndexRedirect to="/journal" />
      <Route path="/journal">
        <IndexRoute component={Terms} />
        <Route path=":academicTermUid">
          <IndexRoute component={Courses} />
        </Route>
      </Route>
      <Route
        path="/files"
        component={FilesPage} />
      <Route
        path="/users"
        components={UsersPage} />
    </Route>
);

export default Routes;
