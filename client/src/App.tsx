import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './index.css';
import Baton from './Baton';
import Loading from './Loading';
import Login from './Login';

enum AuthStatus {
  Unknown = 'UNKNOWN',
  Authenticated = 'AUTHENTICATED',
  Unauthenticated = 'UNAUTHENTICATED',
}

function determineAuthStatus(
  setAuthStatus: (newAuthStatus: AuthStatus) => void,
) {
  fetch('/isLoggedIn')
    .then((resp) => {
      if (resp.status === 200) {
        setAuthStatus(AuthStatus.Authenticated);
      } else {
        setAuthStatus(AuthStatus.Unauthenticated);
      }
    })
    .catch((err) => {
      console.log('failed to determine session state: ', err);
      setAuthStatus(AuthStatus.Unauthenticated);
    });
}

const App = () => {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>(
    AuthStatus.Unknown,
  );

  // TODO: We should expkain this.
  switch (authStatus) {
    case AuthStatus.Unknown:
      determineAuthStatus(setAuthStatus);
      return <Loading />;
    case AuthStatus.Unauthenticated: {
      return (
        <Login
          onSuccessfulLogin={() => {
            setAuthStatus(AuthStatus.Authenticated);
          }}
        />
      );
    }
    case AuthStatus.Authenticated: {
      return (
        <div className="wrapper">
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Baton host="http://localhost:3000" />}
              />
            </Routes>
          </BrowserRouter>
        </div>
      );
    }
    default: {
      throw Error('unreachable app state');
    }
  }
};

export default App;
