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
import { Actions } from 'actions/userManagerActions';
import Checkbox from 'material-ui/lib/checkbox';
import DropDownMenu from 'material-ui/lib/DropDownMenu';
import MenuItem from 'material-ui/lib/menus/menu-item';

class UserDialog extends React.Component {
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
      fullname,
      about,
      roles
    } = this.props;
    this.props.firebaseService.editUser({
      itemKey,
      fullname,
      about,
      roles
    }, (error) => {
      if (error) {
        this.props.actions.setUsermanagerDialogState({ error: error });
      } else {
        this.props.actions.setUsermanagerDialogState(null);
      }
    });

  }

  onCreate() {
    const {
      email,
      password,
      fullname,
      about,
      roles
    } = this.props;
    this.props.firebaseService.createUser({
      email,
      password,
      fullname,
      about,
      roles
    }, (error) => {
      if (error) {
        this.props.actions.setUsermanagerDialogState({error: error});
      } else {
        this.props.actions.setUsermanagerDialogState(null);
      }
    });
  }

  render() {
    const {
      itemKey,
      state,
      email,
      password,
      fullname,
      about,
      roles
    } = this.props;
    //console.log(this.props);
    var actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={() => this.props.actions.setUsermanagerDialogState(null)}
      />
    ];
    if (state === 'create') {
      actions = [
        ...actions,
        <FlatButton
          label="Создать"
          primary={true}
          onTouchTap={this.onCreate.bind(this)}
          disabled={fullname === ''}
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
          disabled={fullname === ''}
        />
      ]
    }
    //console.log(this.props);
    return <Dialog
              title={state === 'create' ? 'Создать' : 'Редактировать'}
              actions={actions}
              modal={false}
              open={state !== 'hide'}
              onRequestClose={() => this.props.actions.setUsermanagerDialogState(null)}
            >
        <ToggleDisplay if={state === 'create'}>
          <TextField
            floatingLabelText="email"
            value={email}
            onChange={(e) => this.props.actions.setUsermanagerDialogState({email: e.target.value})} />
          <br />
          <TextField
            floatingLabelText="Пароль"
            value={password}
            onChange={(e) => this.props.actions.setUsermanagerDialogState({password: e.target.value})} />
          <br />
        </ToggleDisplay>
        <TextField
          floatingLabelText="Полное имя"
          value={fullname}
          onChange={(e) => this.props.actions.setUsermanagerDialogState({fullname: e.target.value})} />
        <br />
        <TextField
          floatingLabelText="Дополнительная информация"
          value={about}
          onChange={(e) => this.props.actions.setUsermanagerDialogState({about: e.target.value})} />
        <br />
        <Checkbox
          label="Администратор"
          checked={roles['admin'] !== void 0 && roles['admin'] !== null}
          onCheck={(e, checked) => this.props.actions.setUsermanagerDialogState({
            roles: {
              ...roles,
              admin: checked ? 'admin' : null
            }
          })}
        />
        <Checkbox
          label="Секретарь"
          checked={roles['clerk'] !== void 0 && roles['clerk'] !== null}
          onCheck={(e, checked) => this.props.actions.setUsermanagerDialogState({
            roles: {
              ...roles,
              clerk: checked ? 'clerk' : null
            }
          })}
        />
        <Checkbox
          label="Учитель"
          checked={roles['teacher'] !== void 0 && roles['teacher'] !== null}
          onCheck={(e, checked) => this.props.actions.setUsermanagerDialogState({
            roles: {
              ...roles,
              teacher: checked ? 'teacher' : null
            }
          })}
        />
      </Dialog>
  }
}
reactMixin(UserDialog.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    ...state.userManager.dialog,
    user: state.user,
    firebaseService: state.firebaseService
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserDialog);
