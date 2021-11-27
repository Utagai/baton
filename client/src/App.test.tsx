import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import App from './App';

afterEach(() => {
  cleanup();
});

async function sleep(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

// TODO: Once we parameterize the host from higher up on the stack we will
// likely have to update the host URIs here.

describe('app', () => {
  test('shows loading screen at first', async () => {
    const isLoggedInBlockTimeMs = 3000; // 3 seconds.
    let returnedFromIsLoggedIn = false;
    const server = setupServer(
      rest.get('http://localhost:3000/isLoggedIn', async (_, res, ctx) => {
        // Basically, make this endpoint hang for some seconds, so that the test
        // has ample time to confirm that the loading page is being shown.
        await sleep(isLoggedInBlockTimeMs);

        returnedFromIsLoggedIn = true;
        return res(ctx.status(200), ctx.json({}));
      }),
      // For the case where we end up loading the baton main page. Testing of
      // its contents is done elsewhere, so we just return the empty array for
      // simplicity.
      rest.get('http://localhost:3000/files', (_, res, ctx) =>
        res(
          ctx.json({
            files: [],
          }),
        ),
      ),
    );

    server.listen();

    render(<App />);

    expect(screen.getByText('LOADING')).toBeInTheDocument();
    await waitFor(
      () => {
        // Now wait until it finally does indeed return.
        expect(returnedFromIsLoggedIn).toBeTruthy();
      },
      // Some padding to account for inaccuracy of the timers.
      { timeout: isLoggedInBlockTimeMs + 1000 },
    );
    server.close();
  });

  test('shows login screen if unauthenticated', async () => {
    const server = setupServer(
      rest.get('http://localhost:3000/isLoggedIn', async (_, res, ctx) =>
        res(ctx.status(403), ctx.json({hi: 'this is a test failure'})),
      ),
    );

    server.listen();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('🔑 Log In')).toBeInTheDocument();
    });
    server.close();
  });

  test('shows baton page if authenticated', async () => {
    const server = setupServer(
      rest.get('http://localhost:3000/isLoggedIn', async (_, res, ctx) =>
        res(ctx.status(200), ctx.json({})),
      ),
      // For when we end up loading the baton main page. Testing of its contents
      // is done elsewhere, so we just return the empty array for simplicity.
      rest.get('http://localhost:3000/files', (_, res, ctx) =>
        res(
          ctx.json({
            files: [],
          }),
        ),
      ),
    );

    server.listen();

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('🔑 Log In')).toBeNull();
    });
    server.close();
  });
});
