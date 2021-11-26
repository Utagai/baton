import React from 'react';

import './index.css';
import Banner from './Banner';
import Button from './Button';
import { BackendClient } from './BackendClient';
import { success, error } from './Notify';

function Login(props: {
  backendClient: BackendClient;
  onSuccessfulLogin: () => void;
}) {
  const [username, setUsername] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  const { backendClient, onSuccessfulLogin } = props;

  const handleLogIn = async () => {
    backendClient
      .login(username, password)
      .then((resp) => {
        if (resp.json.loginSuccessful) {
          onSuccessfulLogin();
          return success('logged in successfully', { username });
        }
        return Promise.reject(resp.json);
      })
      .catch((err) => {
        error('failed to login', err);
      });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    return handleLogIn();
  };

  return (
    <div className="grid justify-center place-items-center">
      <Banner />
      <form onSubmit={handleFormSubmit}>
        <label htmlFor="username_input">
          <div className="m-2">
            <input
              className="text-2xl border-2 rounded-sm text-center"
              id="username_input"
              type="text"
              placeholder="user"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </div>
        </label>
        <label htmlFor="password_input">
          <div className="m-2">
            <input
              className="text-2xl border-2 rounded-sm text-center"
              id="password_input"
              type="password"
              placeholder="pass"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
        </label>
        {/* This input exists so that pressing Enter will submit the form */}
        <input type="submit" className="hidden" />
        <div className="grid place-items-center">
          <Button ariaLabel="Log In" onClick={handleLogIn}>
            🔑 Log In
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Login;
