import 'core-js/fn/object/assign';
import React from 'react';
import { render } from 'react-dom';
import Routes from 'components/Routes';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import configureStore from 'stores/configureStore';
import { initAuth } from 'actions/loginPanelActions';

injectTapEventPlugin();

const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

//console.log(store.getState());

//store.dispatch({type: 'INITIALIZE'});
store.dispatch(initAuth());

render(
  <Provider store={store}>
    <Router history={history} >
      {Routes}
    </Router>
  </Provider>,
  document.getElementById('app')
);
