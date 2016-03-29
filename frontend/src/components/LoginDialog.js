import React from 'react';
import TextField from 'material-ui/lib/text-field';
import { red500 } from 'material-ui/lib/styles/colors';
import CircularProgress from 'material-ui/lib/circular-progress';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';

class LoginDialog extends React.Component {
  renderBody() {
    const {
      user,
      email,
      emailError,
      onEmailChange,
      password,
      passwordError,
      onPasswordChange
    } = this.props;

    if (user == 'load') {
      return (
          <CircularProgress />
      );
    } else if (user == null){
      return (
        <div>
          <TextField
            floatingLabelText='email'
            value={email}
            errorText={emailError}
            onChange={onEmailChange}
          />
          <br/>
          <TextField
            floatingLabelText='Пароль'
            type='password'
            value={password}
            errorText={passwordError}
            onChange={onPasswordChange}
          />
        </div>
      );
    } else {
      return (
        <span>Вы уже вошли как {user.email}</span>
      );
    }
  }
  render() {
    const {
      onRequestClose,
      user,
      onLogin,
      open,
      wholeError
    } = this.props;
    const actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={onRequestClose}
      />,
      <FlatButton
        label="Войти"
        primary={true}
        onTouchTap={onLogin}
      />,
    ];

    return <Dialog
              title='Вход'
              actions={actions}
              modal={false}
              open={open}
              onRequestClose={onRequestClose}
            >
        <span style={{color: red500}}>{wholeError}</span>
        {this.renderBody()}
      </Dialog>
  }
}

export default LoginDialog;
