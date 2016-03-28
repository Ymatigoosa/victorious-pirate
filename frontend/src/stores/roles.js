import FirebaseStore from 'stores/FirebaseStore';

export const check = (roles) => (nextState, replace) => {

  const isauthorized = FirebaseStore.isLoggedIn()
    && role.reduce((a, b) => a && FirebaseStore.isInRole(b), true);

  if (!isauthorized) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }

};

export const rolename = (role) =>
  role == 'admin'
    ? 'Администратор'
    : role == 'clerk'
      ? 'Секретарь'
      : role == 'teacher'
       ? 'Учитель'
       : `Неизвестная роль '${role}'`;
