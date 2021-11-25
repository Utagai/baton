import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './index.css';
import Baton from './Baton';
import Loading from './Loading';
import Login, { AuthTokens } from './Login';

async function getTokens(): Promise<AuthTokens> {
  return fetch('/getTokens', { method: 'GET' }).then((resp) => resp.json());
}

enum AuthStatus {
  Unknown = 'UNKNOWN',
  Authenticated = 'AUTHENTICATED',
  Unauthenticated = 'UNAUTHENTICATED',
}

type AppState = {
  authStatus: AuthStatus;
  tokens: AuthTokens | undefined;
};

const App = () => {
  const [appState, setAppState] = React.useState<AppState>({
    authStatus: AuthStatus.Unknown,
    tokens: undefined,
  });

  // TODO: We should expkain this.
  switch (appState.authStatus) {
    case AuthStatus.Unknown: {
      getTokens()
        .then((tokens) => {
          if (!(tokens.jwtToken && tokens.antiCSRFToken)) {
            setAppState({
              authStatus: AuthStatus.Unauthenticated,
              tokens,
            });
          } else {
            setAppState({
              authStatus: AuthStatus.Authenticated,
              tokens,
            });
          }
        })
        .catch((_) => {
          setAppState({
            authStatus: AuthStatus.Unauthenticated,
            tokens: undefined,
          });
        });
      return <Loading />;
    }
    case AuthStatus.Unauthenticated: {
      return (
        <Login
          // TODO: May want to unpack tokens...
          antiCSRFToken={appState.tokens!.antiCSRFToken}
          setToken={(token_: AuthTokens) => {
            setAppState({
              authStatus: AuthStatus.Authenticated,
              tokens: token_,
            });
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
                element={
                  <Baton
                    host="http://localhost:3000"
                    antiCSRFToken={appState.tokens!.antiCSRFToken}
                  />
                }
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
