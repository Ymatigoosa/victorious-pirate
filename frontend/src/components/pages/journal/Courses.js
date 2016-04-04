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
import { deleteAllFromFirebase } from 'utils/Utils';

const iconButtonElement = (
  <IconButton
    touch={true}
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

class Courses extends React.Component {
  constructor(props) {
    super(props);

    this.writeRef = this.props.firebaseService.ref
      .child('courses');

    this.ref = this.writeRef
      .orderByChild('academicTermUid')
      .equalTo(this.props.params.academicTermUid);

    this.state = {
      items: null,
      search: '',
      dialogMode: 'hide',
      dialogName: '',
      dialogDescription: '',
      dialogItem: null,
      academicTerm: null
    };
  }
  componentWillMount() {
    this.bindAsArray(this.ref, 'items', (error) => console.error(error));
    this.bindAsObject(this.props.firebaseService.ref.child('academic-terms').child(this.props.params.academicTermUid), 'academicTerm', (error) => console.error(error));
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
  onDialogDescriptionChange(e) {
    this.setState({dialogDescription: e.target.value})
  }
  onCreate() {
    this.writeRef.push({
      name: this.state.dialogName,
      description: this.state.dialogDescription,
      academicTermUid: this.props.params.academicTermUid
    });
    this.onDialogClose();
  }
  onSave(key) {
    this.writeRef.child(key).set({
      name: this.state.dialogName,
      description: this.state.dialogDescription,
      academicTermUid: this.props.params.academicTermUid
    });
    this.onDialogClose();
  }
  onDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить предмет "${item.name}"?\nОтменить это действие невозможно!`)) {
      const root = this.props.firebaseService.ref;
      root.child('course-dates').orderByChild('courseUid').equalTo(key).on('value', deleteAllFromFirebase);
      root.child('student-marks').orderByChild('courseUid').equalTo(key).on('value', deleteAllFromFirebase);
      this.writeRef.child(key).remove();
      this.onDialogClose();
    }
  }
  onDialogClose() {
    this.setState({
      dialogName: '',
      dialogDescription: '',
      dialogMode: 'hide',
      dialogItem: null
    })
  }
  onDialogOpenCreate() {
    this.setState({
      dialogName: '',
      dialogDescription: '',
      dialogMode: 'create'
    })
  }
  onDialogOpenEdit(item) {
    const key = item['.key'];
    this.setState({
      dialogName: item.name,
      dialogDescription: item.description,
      dialogMode: 'edit',
      dialogItem: item
    })
  }
  onListClick(academicTermUid, courceUid) {
    this.props.routeActions.push(`/journal/${academicTermUid}/${courceUid}`);
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
      (<ListItem
        onTouchTap={this.onListClick.bind(this, this.props.params.academicTermUid, key)}
        key={key+'_ListItem'}
        rightIconButton={rightIconMenu}>
          <Highlighter search={search} text={item.name} />
          <div className='ListItemDescription'>
            <Highlighter search={search} text={item.description} />
          </div>
        </ListItem>
      ),
      (<Divider key={key+'_Divider'}/>)
    ];
  }
  render_dialog() {
    const { dialogMode, dialogName, dialogDescription, dialogItem } = this.state;
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
        <br />
        <TextField
          floatingLabelText="Описание"
          value={dialogDescription}
          onChange={this.onDialogDescriptionChange.bind(this)} />
          <ToggleDisplay if={dialogMode === 'edit'}>
            <div>
            <RaisedButton label='Удалить' primary={true} onMouseUp={this.onDelete.bind(this, dialogItem)} />
            </div>
          </ToggleDisplay>
      </Dialog>
  }
  render() {
    const { search, items, academicTerm } = this.state;

    const breadcrumbs = [
      <Link to='/journal'>Журнал</Link>,
      <Link to={`/journal/${this.props.params.academicTermUid}`}>{academicTerm == null ? '...'  : academicTerm.name}</Link>
    ];

    const filtered = search === ''
      ? items
      : items.filter((value) => value.name.indexOf(search) >= 0 || value.description.indexOf(search))

    return (
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <div style={{padding:'20px'}}>
          <TextField
            floatingLabelText="Поиск"
            value={search}
            onChange={this.onSearchChange.bind(this)}
          />
        </div>
        <List>
          <Subheader>Выберите предмет</Subheader>
          <ToggleDisplay if={this.canUserWrite()}>
            <ListItem leftIcon={<AddCircleIcon />} onTouchTap={this.onDialogOpenCreate.bind(this)}>Новый предмет</ListItem>
            <Divider />
          </ToggleDisplay>
          { filtered.map((i) => this.render_item(i)) }
        </List>
        {this.render_dialog()}
      </div>
    );
  }
}
reactMixin(Courses.prototype, ReactFireMixin);

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

export default connect(mapStateToProps, mapDispatchToProps)(Courses);
