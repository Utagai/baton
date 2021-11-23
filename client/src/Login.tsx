import React from 'react';

import './index.css';
import { success, error } from './Notify';

type UserCredentials = { username: string; password: string };
async function login(creds: UserCredentials): Promise<string> {
  console.log('sending creds: ', JSON.stringify(creds));
  return fetch('/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(creds),
  })
    .then((resp) => Promise.all([resp.json(), Promise.resolve(resp.status)]))
    .then(([json, statusCode]: [any, number]) => {
      if (statusCode !== 200) {
        return Promise.reject(json);
      }
      return Promise.resolve(json.token);
    });
}

function Login(props: { setToken: (token: string) => void }) {
  const { setToken } = props;

  const [username, setUsername] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login({
      username,
      password,
    })
      .then((token) => {
        setToken(token);
        success('logged in successfully', { user: username });
      })
      .catch((err) => {
        console.log('err: ', err);
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
