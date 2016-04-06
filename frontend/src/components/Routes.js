import React from 'react';
import { Router, Route, IndexRedirect, IndexRoute } from 'react-router';

import UsersPage from 'components/pages/users/UsersPage';
import Terms from 'components/pages/journal/Terms';
import Courses from 'components/pages/journal/Courses';
import Journal from 'components/pages/journal/Journal';
import StudentGroups from 'components/pages/journal/StudentGroups';
import Categories from 'components/pages/files/Categories';
import Files from 'components/pages/files/Files';
import FileView from 'components/pages/files/FileView';
import LayoutContainer from 'components/LayoutContainer';

//StudentGroups

const Routes = (
    <Route path="/" component={LayoutContainer}>
      <IndexRedirect to="/files" />
      <Route path="/journal">
        <IndexRoute component={Terms} />
        <Route path=":academicTermUid">
          <IndexRoute component={Courses} />
          <Route path=":courseUid">
            <IndexRoute component={StudentGroups} />
            <Route path=":studentGroupUid">
              <IndexRoute component={Journal} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="/files" >
        <IndexRoute component={Categories} />
        <Route path=":categoryUid" >
          <IndexRoute component={Files} />
          <Route path=":fileUid" >
            <IndexRoute component={FileView} />
          </Route>
        </Route>
      </Route>
      <Route
        path="/users"
        components={UsersPage} />
    </Route>
);

export default Routes;
