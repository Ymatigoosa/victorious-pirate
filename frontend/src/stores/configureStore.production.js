import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from 'reducers';
import multi from 'redux-multi'

const router = routerMiddleware(browserHistory);

const enhancer = applyMiddleware(thunk, router, multi);

export default function configureStore(initialState) {
  return createStore(rootReducer, initialState, enhancer);
}
