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
import UserDialog from 'components/pages/users/UserDialog'
import { Actions } from 'actions/userManagerActions';

const iconButtonElement = (
  <IconButton
    touch={true}
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

class UserManager extends React.Component {
  constructor(props) {
    super(props);

    this.usersRef = this.props.firebaseService.ref
      .child('users');
  }
  componentWillMount() {
    this.bindAsArray(
      this.usersRef,
      'items',
      (error) => console.error(error)
    );

    //this.bindAsObject(
    //  this.props.firebaseService.ref.child('academic-terms').child(this.props.params.academicTermUid),
    //  'academicTerm',
    //  (error) => console.error(error)
    //);
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.state !== nextState
      || !shallowequal(this.props, nextProps);
  }
  componentWillUnmount() {
    this.props.actions.setUsermanagerSearch('');
  }

  render_item(item) {
    const key = item['.key'];

    const { search } = this.props;

    const rightIconMenu = (
        <IconMenu
          iconButtonElement={iconButtonElement}
          anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'right', vertical: 'top'}}>
          <MenuItem onTouchTap={() => this.props.actions.setUsermanagerDialogState({
              itemKey: key,
              state: 'edit',
              email: '',
              password: '',
              fullname: item.fullname,
              about: item.about,
              roles: item.roles
            })
          }>Редактировать</MenuItem>
        </IconMenu>
    );
    return [
      (
          <ListItem
          key={key+'_ListItem'}
          rightIconButton={rightIconMenu}>
            <Highlighter search={search} text={item.fullname} />
            <div className='ListItemDescription'>
              <Highlighter search={search} text={item.about} />
            </div>
          </ListItem>
      ),
      (<Divider key={key+'_Divider'}/>)
    ];
  }

  render() {
    const { search, user } = this.props;
    const { items } = this.state;

    if (!user.isInRole(['admin'])) {
      return <div style={{padding:'20px'}}>У вас нет прав для просмотра этой страницы</div>
    }

    const breadcrumbs = [
      'Управление пользователями'
    ];

    const filtered = search === '' || items === void 0
      ? items
      : items.filter((value) => value.fullname.indexOf(search) >= 0 || value.about.indexOf(search) >= 0 )

    return (
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <div style={{padding:'20px'}}>
          <TextField
            floatingLabelText="Поиск"
            value={search}
            onChange={(e) => this.props.actions.setUsermanagerSearch(e.target.value)}
          />
        </div>
        <List>
          <Subheader>Выберите категорию</Subheader>
          <ListItem leftIcon={<AddCircleIcon />} onTouchTap={() => this.props.actions.setUsermanagerDialogState({
              itemKey: null,
              state: 'create',
              email: '',
              password: '',
              fullname: '',
              about: '',
              roles: ''
            })
          } >Новый пользователь</ListItem>
          <Divider />
          { filtered.map((i) => this.render_item(i)) }
        </List>
        <UserDialog />
      </div>
    );
  }
}
reactMixin(UserManager.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    search: state.userManager.search,
    firebaseService: state.firebaseService,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    routeActions: bindActionCreators({ push, replace, go, goForward, goBack }, dispatch),
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserManager);
