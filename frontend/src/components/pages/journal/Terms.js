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

const iconButtonElement = (
  <IconButton
    touch={true}
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

class Terms extends React.Component {
  constructor(props) {
    super(props);

    //this.ref = https://victorious-pirate.firebaseio.com
    this.ref = this.props.firebaseService.ref.child('academic-terms');
    this.state = {
      items: null,
      search: '',
      dialogMode: 'hide',
      dialogName: '',
      dialogItem: null
    };
  }
  componentWillMount() {
    this.bindAsArray(this.ref, 'items', (error) => console.error(error));
  }
  componentWillUnmount() {
    //this.unbind('items');
  }
  onSearchChange(e) {
    this.setState({search: e.target.value})
  }
  onDialogNameChange(e) {
    this.setState({dialogName: e.target.value})
  }
  onCreate() {
    this.ref.push({
      name: this.state.dialogName
    });
    this.onDialogClose();
  }
  onSave(key) {
    this.ref.child(key).set({
      name: this.state.dialogName
    });
    this.onDialogClose();
  }
  onDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить семестр "${item.name}"?\nОтменить это действие невозможно!`)) {
      this.ref.child(key).remove();
      this.onDialogClose();
    }
  }
  onDialogClose() {
    this.setState({
      dialogName: '',
      dialogMode: 'hide',
      dialogItem: null
    })
  }
  onDialogOpenCreate() {
    this.setState({
      dialogName: '',
      dialogMode: 'create'
    })
  }
  onDialogOpenEdit(item) {
    const key = item['.key'];
    this.setState({
      dialogName: item.name,
      dialogMode: 'edit',
      dialogItem: item
    })
  }
  canUserWrite() {
    return this.props.user.isInRole(['admin', 'clerk', 'teacher']);
  }
  render_item(item) {
    const key = item['.key'];
    const { search } = this.state;
    const rightIconMenu = (
      <ToggleDisplay if={this.canUserWrite()}>
        <IconMenu
          iconButtonElement={iconButtonElement}
          anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'right', vertical: 'top'}}>
          <MenuItem onTouchTap={this.onDialogOpenEdit.bind(this, item)}>Редактировать</MenuItem>
          <MenuItem onTouchTap={this.onDelete.bind(this, item)}>Удалить</MenuItem>
        </IconMenu>
      </ToggleDisplay>
    );
    return [
      (<ListItem key={key+'_ListItem'} rightIconButton={rightIconMenu}>
        <Highlighter search={search} text={item.name} />
      </ListItem>),
      (<Divider key={key+'_Divider'}/>)
    ];
  }
  render_dialog() {
    const { dialogMode, dialogName, dialogItem } = this.state;
    const key = dialogItem != null ? dialogItem['.key'] : '';
    var actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={this.onDialogClose.bind(this)}
      />
    ];
    if (dialogMode === 'create') {
      actions = [
        ...actions,
        <FlatButton
          label="Создать"
          primary={true}
          onTouchTap={this.onCreate.bind(this)}
          disabled={dialogName === ''}
        />
      ]
    }
    if (dialogMode === 'edit') {
      actions = [
        ...actions,
        <FlatButton
          label="Сохранить"
          primary={true}
          onTouchTap={this.onSave.bind(this, key)}
          disabled={dialogName === ''}
        />
      ]
    }

    return <Dialog
              title={dialogMode === 'create' ? 'Создать' : 'Редактировать'}
              actions={actions}
              modal={false}
              open={dialogMode !== 'hide'}
              onRequestClose={this.onDialogClose.bind(this)}
            >
        <TextField
          floatingLabelText="Название"
          value={dialogName}
          onChange={this.onDialogNameChange.bind(this)} />
          <ToggleDisplay if={dialogMode === 'edit'}>
            <div>
            <RaisedButton label='Удалить' primary={true} onMouseUp={this.onDelete.bind(this, dialogItem)} />
            </div>
          </ToggleDisplay>
      </Dialog>
  }
  render() {
    const { search, items } = this.state;

    const filtered = search === ''
      ? items
      : items.filter((value) => value.name.indexOf(search) >= 0)

    return (
      <div>
        <div style={{padding:'20px'}}>
          <TextField
            floatingLabelText="Поиск"
            value={search}
            onChange={this.onSearchChange.bind(this)}
          />
        </div>
        <List>
          <Subheader>Выберите семестр</Subheader>
          <ToggleDisplay if={this.canUserWrite()}>
            <ListItem leftIcon={<AddCircleIcon />} onTouchTap={this.onDialogOpenCreate.bind(this)}>Новый семестр</ListItem>
            <Divider />
          </ToggleDisplay>
          { filtered.map((i) => this.render_item(i)) }
        </List>
        {this.render_dialog()}
      </div>
    );
  }
}
reactMixin(Terms.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    firebaseService: state.firebaseService,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    routeActions: bindActionCreators({ push, replace, go, goForward, goBack }, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Terms);
