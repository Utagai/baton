import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Login from './Login';

const testUsername = 'test';
const testPlaintextPassword = 'hello';

const server = setupServer(
  rest.post('/login', (req, res, ctx) => {
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
    render(<Login onSuccessfulLogin={() => {}} />);

    expect(screen.getByText('Please Log In')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('username')).toBeInTheDocument(); // Username input field.
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('with valid credentials passes', async () => {
    let loginWasSuccessful = false;
    render(
      <Login
        onSuccessfulLogin={() => {
          loginWasSuccessful = true;
        }}
      />,
    );

    const usernameInput = screen.getByPlaceholderText('username');
    act(() => {
      userEvent.type(usernameInput, testUsername);
    });
    const passwordInput = screen.getByPlaceholderText('password');
    act(() => {
      userEvent.type(passwordInput, testPlaintextPassword);
    });

    const submitButton = screen.getByText('Submit');
    act(() => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(loginWasSuccessful).toBeTruthy();
    });
  });

  test('with invalid credentials fails', async () => {
    render(<Login onSuccessfulLogin={() => {}} />);

    const usernameInput = screen.getByPlaceholderText('username');
    act(() => {
      userEvent.type(usernameInput, testUsername);
    });
    const passwordInput = screen.getByPlaceholderText('password');
    act(() => {
      userEvent.type(passwordInput, 'not correct password');
    });

    const submitButton = screen.getByText('Submit');
    act(() => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to login/)).toBeInTheDocument();
    });
  });
});
