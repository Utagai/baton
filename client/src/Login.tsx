import React from 'react';

import './index.css';
import { BackendClient } from './BackendClient';
import { success, error } from './Notify';

function Login(props: {
  backendClient: BackendClient;
  onSuccessfulLogin: () => void;
}) {
  const [username, setUsername] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  const { backendClient, onSuccessfulLogin } = props;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div>
      <h1>Please Log In</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username_input">
          <p>Username</p>
          <input
            id="username_input"
            type="text"
            placeholder="username"
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
        </label>
        <label htmlFor="password_input">
          <p>Password</p>
          <input
            id="password_input"
            type="password"
            placeholder="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}

export default Login;
