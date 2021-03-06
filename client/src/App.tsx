import React from 'react';

import './index.css';
import { BackendClient } from './BackendClient';
import Baton from './Baton';
import Loading from './Loading';
import Login from './Login';

enum AuthState {
  Unknown = 'UNKNOWN',
  Authenticated = 'AUTHENTICATED',
  Unauthenticated = 'UNAUTHENTICATED',
}

// One may wonder why we do not just look at the cookie(s). This is because our
// cookies are HTTP-only, so we can't actually view them from here. We could
// disable the HTTP-only setting, but it is less secure, so we're paying the
// cost of an extra API call instead.
async function fetchAuthState(
  backendClient: BackendClient,
): Promise<AuthState> {
  // LMAO. OK, listen, I'm really proud of my 'Loading' animation and I will not
  // have it be unseen!!!
  // TODO: Probably disable this during development, and enable it in
  // production. :D
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  return backendClient
    .isLoggedIn()
    .then((resp) => {
      if (resp.json.isLoggedIn) {
        return AuthState.Authenticated;
      }
      return AuthState.Unauthenticated;
    })
    .catch(
      (_) =>
        /* istanbul ignore next */
        AuthState.Unauthenticated,
    );
}

const App = () => {
  const [authState, setAuthState] = React.useState<AuthState>(
    AuthState.Unknown,
  );

  const backendClient = new BackendClient(
    `${
      process.env.REACT_APP_BACKEND_API_HOSTNAME
        ? process.env.REACT_APP_BACKEND_API_HOSTNAME
        : 'http://localhost:3000'
    }`,
  );

  // TODO: We should expkain this.
  switch (authState) {
    case AuthState.Unknown:
      fetchAuthState(backendClient).then((innerAuthState) =>
        setAuthState(innerAuthState),
      );
      return <Loading />;
    case AuthState.Unauthenticated: {
      return (
        <Login
          backendClient={backendClient}
          onSuccessfulLogin={() => {
            setAuthState(AuthState.Authenticated);
          }}
        />
      );
    }
    case AuthState.Authenticated: {
      return <Baton backendClient={backendClient} />;
    }
    default: {
      /* istanbul ignore next */
      throw Error('unreachable app state');
    }
  }
};

export default App;
