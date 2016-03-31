import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Counter from 'components/Layout';
import * as layoutActions from 'actions/layoutActions';
import * as loginPanelActions from 'actions/loginPanelActions';
import * as userActions from 'actions/userActions';
import { push, replace, go, goForward, goBack } from 'react-router-redux';
import Layout from 'components/Layout'

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    routing: state.routing,
    layout: state.layout,
    loginPanel: state.loginPanel,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    layoutActions: bindActionCreators(layoutActions, dispatch),
    loginPanelActions: bindActionCreators(loginPanelActions, dispatch),
    userActions: bindActionCreators(userActions, dispatch),
    routeActions: bindActionCreators({ push, replace, go, goForward, goBack }, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Layout);
