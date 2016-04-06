import React from 'react';
import reactMixin from 'react-mixin';
import ReactFireMixin from 'reactfire';
import Highlighter from 'components/Highlighter';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Divider from 'material-ui/lib/divider';
import Subheader from 'material-ui/lib/Subheader';
import Avatar from 'material-ui/lib/avatar';
import {grey400, darkBlack, lightBlack, pinkA200} from 'material-ui/lib/styles/colors';
import IconButton from 'material-ui/lib/icon-button';
import MoreVertIcon from 'material-ui/lib/svg-icons/navigation/more-vert';
import AddCircleIcon from 'material-ui/lib/svg-icons/content/add-circle';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import ActionGrade from 'material-ui/lib/svg-icons/action/grade';
import CircularProgress from 'material-ui/lib/circular-progress';
import RaisedButton from 'material-ui/lib/raised-button';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push, replace, go, goForward, goBack } from 'react-router-redux';
import TextField from 'material-ui/lib/text-field';
import Breadcrumbs from 'components/Breadcrumbs';
import { Link } from 'react-router';
import ToggleDisplay from 'react-toggle-display';
import shallowequal from 'shallowequal';
import CategoriesDialog from 'components/pages/files/CategoriesDialog'
import { Actions } from 'actions/filesActions';

class FileView extends React.Component {
  constructor(props) {
    super(props);

  }
  componentWillMount() {
    this.bindAsObject(
      this.props.firebaseService.ref.child('documents').child(this.props.params.fileUid),
      'file',
      (error) => console.error(error)
    );

    this.bindAsObject(
      this.props.firebaseService.ref.child('document-categories').child(this.props.params.categoryUid),
      'category',
      (error) => console.error(error)
    );
  }
  shouldComponentUpdate(nextProps, nextState) {

  }
  componentWillUnmount() {
  }


  render() {
    const { file, category } = this.state;

    const breadcrumbs = [
      <Link to='/files'>Категории</Link>,
      <Link to={`/files/${this.props.params.categoryUid}`} >{category === void 0 || category === null ? '...'  : category.name}</Link>,
      (file === void 0 || file === null ? '...'  : file.name)
    ];

    return (
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <ToggleDisplay if={file != null && file !== void 0} >
          <div type="filepicker-preview" data-fp-url={`${file.fpfile.url}`} > </div>
        </ToggleDisplay>
      </div>
    );
  }
}
reactMixin(FileView.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    firebaseService: state.firebaseService,
    filepicker: state.filepicker,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    routeActions: bindActionCreators({ push, replace, go, goForward, goBack }, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FileView);
