// We need to have these tests in a separate file because they explicitly test
// the LoggedInCheck middleware, which we prefer disabling for the vast majority
// of tests.
// Ideally, Jest would let us mock it for a subset of tests or for specific test
// suites, but it doesn't seem to let us do that (or at least, we don't know how
// to do it).
// For future us: we tried most of the things you'd find from a quick Google
// search, but you're free to feel brave.

import request from 'supertest';
import dotenv from 'dotenv';

import {
  getTestApp,
  testUsername,
  testPlaintextPassword,
  addTestUserToDB,
} from './TestHelpers';

dotenv.config();

describe('login session', () => {
  async function loginToApp(agent: request.SuperAgentTest) {
    const resp = await agent
      .post('/login')
      .field('username', testUsername)
      .field('password', testPlaintextPassword);

    expect(resp.statusCode).toBe(200);
  }

  test('that is authenticated returns true from isLoggedIn', async () => {
    const { currentTestName } = expect.getState();

    addTestUserToDB(currentTestName);

    const app = getTestApp(currentTestName);
    // When you use supertest's agent, it automatically passes along your
    // cookies from prior requests, just like in the browser. We don't have to
    // do anything special here.
    const agent = request.agent(app);
    await loginToApp(agent);

    await agent.get('/isLoggedIn').expect(200);
  });

  test('that is not authenticated returns false from isLoggedIn', async () => {
    const { currentTestName } = expect.getState();
    const app = getTestApp(currentTestName);
    const agent = request.agent(app);

    await agent.get('/isLoggedIn').expect(403);
  });

  test('that is authenticated can make API requests', async () => {
    const { currentTestName } = expect.getState();

    addTestUserToDB(currentTestName);

    const app = getTestApp(currentTestName);
    const agent = request.agent(app);
    await loginToApp(agent);

    await agent.get('/files').expect(200);
  });

  test('that is not authenticated cannot make API requests', async () => {
    const { currentTestName } = expect.getState();
    const app = getTestApp(currentTestName);
    const agent = request.agent(app);

    await agent.get('/isLoggedIn').expect(403);
    await agent.get('/files').expect(403);
  });
});
