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

  onDelete(itemKey, name, isTemplate, fpfile) {
    const msg = isTemplate
      ? `Вы действительно хотите удалить шаблон "${name}"?\nВсе файлы, использующие этот шаблон окажутся недоступны\nОтменить это действие невозможно!`
      : `Вы действительно хотите удалить файл "${name}"?\nОтменить это действие невозможно!`
    if (confirm(msg)) {
      //console.log(key);
      this.props.actions.deleteFile(itemKey, fpfile);
      this.props.actions.setFileCreateByTemplateState(null);
    }
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
      templates
    } = this.props;
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
          disabled={name === '' || (templates !== null && templates !== void 0 && templateUid !== '')}
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
          disabled={name === '' || (templates !== null && templates !== void 0 && templateUid !== '')}
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
        <ToggleDisplay if={templates !== null && templates !== void 0}>
          <DropDownMenu value={templateUid}>
          <MenuItem value={''} primaryText={'Выберите шаблон'} onTouchTap={() => this.props.actions.setFileUploadDialogState({templateUid: '', fpfile: null})} />
          {templates.map( (item) =>
            <MenuItem value={item['.key']} key={item['.key']} primaryText={item.name} onTouchTap={() => this.props.actions.setFileUploadDialogState({templateUid: item['.key'], fpfile: item.fpfile})} />
          )}
          </DropDownMenu>
        </ToggleDisplay>
        <ToggleDisplay if={templates === null || templates === void 0}>
          <Checkbox
            label="Шаблон"
            checked={isTemplate}
            onCheck={(e, checked) => this.props.actions.setCategoryDialogState({isTemplate: checked})}
          />
        </ToggleDisplay>
          <ToggleDisplay if={state === 'edit'}>
            <div>
            <RaisedButton label='Удалить' primary={true} onMouseUp={this.onDelete.bind(this, itemKey, name, isTemplate, fpfile )} />
            </div>
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
