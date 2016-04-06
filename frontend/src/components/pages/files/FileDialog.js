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
import { Actions } from 'actions/filesActions';
import Checkbox from 'material-ui/lib/checkbox';
import DropDownMenu from 'material-ui/lib/DropDownMenu';
import MenuItem from 'material-ui/lib/menus/menu-item';

class FileDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentWillMount() {

  }
  shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.state === 'hide' && nextProps.state === 'hide')
      || !shallowequal(this.props, nextProps);
  }
  componentWillUnmount() {
    //this.unbind('items');
  }

  onSave() {
    const {
      itemKey,
      name,
      fpfile,
      categoryUid,
      templateUid,
      isTemplate
    } = this.props;
    this.props.actions.saveUploadedFileFromDialog({
      itemKey,
      name,
      fpfile,
      categoryUid,
      templateUid,
      isTemplate
    });

    this.props.actions.setFileUploadDialogState(null);
  }

  render() {
    const {
      itemKey,
      state,
      name,
      fpfile,
      categoryUid,
      templateUid,
      isTemplate,
      showTemplates,
      templates
    } = this.props;
    //console.log(this.props);
    var actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={() => this.props.actions.setFileUploadDialogState(null)}
      />
    ];
    if (state === 'create') {
      actions = [
        ...actions,
        <FlatButton
          label="Создать"
          primary={true}
          onTouchTap={this.onSave.bind(this)}
          disabled={name === '' || (showTemplates && templateUid !== '')}
        />
      ]
    }
    if (state === 'edit') {
      actions = [
        ...actions,
        <FlatButton
          label="Сохранить"
          primary={true}
          onTouchTap={this.onSave.bind(this)}
          disabled={name === '' || (showTemplates && templateUid !== '')}
        />
      ]
    }
    //console.log(this.props);
    return <Dialog
              title={state === 'create' ? 'Создать' : 'Редактировать'}
              actions={actions}
              modal={false}
              open={state !== 'hide'}
              onRequestClose={() => this.props.actions.setFileUploadDialogState(null)}
            >
        <TextField
          floatingLabelText="Название"
          value={name}
          onChange={(e) => this.props.actions.setFileUploadDialogState({name: e.target.value})} />
        <br />
        <ToggleDisplay if={showTemplates}>
          <DropDownMenu value={templateUid}>
          <MenuItem value={''} primaryText={'Выберите шаблон'} onTouchTap={() => this.props.actions.setFileUploadDialogState({templateUid: '', fpfile: null})} />
          {templates.map( (item) =>
            <MenuItem value={item['.key']} key={item['.key']} primaryText={item.name} onTouchTap={() => this.props.actions.setFileUploadDialogState({templateUid: item['.key'], fpfile: null})} />
          )}
          </DropDownMenu>
        </ToggleDisplay>
        <ToggleDisplay if={!showTemplates}>
          <Checkbox
            label="Шаблон"
            checked={isTemplate}
            onCheck={(e, checked) => this.props.actions.setFileUploadDialogState({isTemplate: checked})}
          />
        </ToggleDisplay>
      </Dialog>
  }
}
reactMixin(FileDialog.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    ...state.files.fileUploadDialog,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FileDialog);
