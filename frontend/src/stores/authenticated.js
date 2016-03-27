import FirebaseStore from 'stores/FirebaseStore';

export default (roles) => (nextState, replace) => {

  const isauthorized = FirebaseStore.isLoggedIn()
    && role.reduce((a, b) => a && FirebaseStore.isInRole(b), true);

  if (!isauthorized) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }

}
