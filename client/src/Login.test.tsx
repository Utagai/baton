import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Login from './Login';
import { BackendClient } from './BackendClient';

const testUsername = 'test';
const testPlaintextPassword = 'hello';

// TODO: Once we parameterize the host from higher up on the stack we will
// likely have to update the host URIs here.

const server = setupServer(
  rest.post('http://localhost/login', (req, res, ctx) => {
    const { username, password } = req.body as Record<string, any>;
    if (testUsername === username && testPlaintextPassword === password) {
      return res(ctx.status(200), ctx.json({}));
    }

    return res(ctx.status(403), ctx.json({ err: 'failed authentication' }));
  }),
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

describe('login form', () => {
  test('is rendered correctly', () => {
    render(
      <Login
        backendClient={new BackendClient('http://localhost/')}
        onSuccessfulLogin={() => {}}
      />,
    );

    expect(screen.getByText(/baton/i)).toBeInTheDocument();
    expect(screen.getByText(/🪄/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user')).toBeInTheDocument(); // Username input field.
    expect(screen.getByPlaceholderText('pass')).toBeInTheDocument();
    expect(screen.getByText('🔑 Log In')).toBeInTheDocument();
  });

  test('with valid credentials passes', async () => {
    let loginWasSuccessful = false;
    render(
      <Login
        backendClient={new BackendClient('http://localhost/')}
        onSuccessfulLogin={() => {
          loginWasSuccessful = true;
        }}
      />,
    );

    const usernameInput = screen.getByPlaceholderText('user');
    act(() => {
      userEvent.type(usernameInput, testUsername);
    });
    const passwordInput = screen.getByPlaceholderText('pass');
    act(() => {
      userEvent.type(passwordInput, testPlaintextPassword);
    });

    const submitButton = screen.getByText('🔑 Log In');
    act(() => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(loginWasSuccessful).toBeTruthy();
    });
  });

  test('with invalid credentials fails', async () => {
    render(
      <Login
        backendClient={new BackendClient('http://localhost/')}
        onSuccessfulLogin={() => {}}
      />,
    );

    const usernameInput = screen.getByPlaceholderText('user');
    act(() => {
      userEvent.type(usernameInput, testUsername);
    });
    const passwordInput = screen.getByPlaceholderText('pass');
    act(() => {
      userEvent.type(passwordInput, 'not correct password');
    });

    const submitButton = screen.getByText('🔑 Log In');
    act(() => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      // TODO: Waiting on notifications to appear on the UI is a bit fragile it
      // feels like... is there a better way, or is this the best way because it
      // most closely mimics how a _user_ would use Baton?
      expect(screen.getByText(/Failed to login/)).toBeInTheDocument();
    });
  });
});
