import React from 'react';
import TextField from 'material-ui/lib/text-field';
import { red500 } from 'material-ui/lib/styles/colors';
import CircularProgress from 'material-ui/lib/circular-progress';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import { rolename } from 'components/RoleName';
import RaisedButton from 'material-ui/lib/raised-button';

class ProfileDialog extends React.Component {
  renderBody() {
    const { onLogout, user } = this.props;

    if (user == 'load') {
      return (
        <CircularProgress />
      );
    } else if (user == null){
      return (
        <span>Вы не вошли</span>
      );
    } else {
      return (
        <div>
          <dl>
            <dt>Полное имя</dt>
             <dd>{user.fullname}</dd>
            <dt>email</dt>
             <dd>{user.email}</dd>
           <dt>Описание</dt>
            <dd>{user.about}</dd>
          <dt>Доступные роли</dt>
           <dd>{Object.keys(user.roles).map(i => rolename(i)).join(', ')}</dd>
          </dl>
          <RaisedButton label='Выйти' primary={true} onMouseUp={onLogout}/>
        </div>
      );
    }
  }
  render() {
    const {
      onRequestClose,
      open,
    } = this.props;
    const actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={onRequestClose}
      />
    ];

    return <Dialog
              title='Профиль'
              actions={actions}
              modal={false}
              open={open}
              onRequestClose={onRequestClose}
            >
        {this.renderBody()}
      </Dialog>
  }
}

export default ProfileDialog;
