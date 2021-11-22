import { addDays, format, formatDuration, intervalToDuration } from 'date-fns';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';
import userEvent from '@testing-library/user-event';

import App from './App';

// So this is tragic and I'm doing this because I just genuinely don't know how
// else to do this in a way that does not involve a janky (and flaky) sleep
// call. Basically, what is happening is that when the tests run, there is a
// chance, especially for the very simple/cheap tests, that we finish the test
// so quickly that the React code has not even had a chance to hit the backend
// API yet. However, because stopping a test does not cancel currently running
// React threads, namely, the useEffect thread, that API call actually does come
// through, it just comes through later, after we've moved onto subsequent
// tests. This however, and unfortunately, is pretty bad, because it means prior
// tests can influence later tests.
// Anyways, to address this, we are keeping track of two counts:
//  * The number of tests currently ran so far.
//  * The number of times we have hit the /files endpoint, which is the last API
//  call we make in useEffect.
// Then, in our afterEach(), we wait in a sleep-loop until we've hit the /files
// API endpoint as many times as we have ran tests, ensuring that before we
// start the next test, the current test has finished its useEffect and won't
// run again.
// This is not ideal and it is kind of hacky, I just don't know how else to do
// this in a way that is either not flaky or equally hacky/dirty but in the
// application code instead of the test code.
// NOTE: One idea that I do have though is seeing if it is possible to create a
// wholly separate server per test, e.g., on different ports. I don't see any
// information in the MSW docs for how we could do this, so it may require us
// scrapping it for something like express and running a backend server on
// different ports for each test.
let numTestsRanCount = 0;
let filesEndpointCalledCount = 0;

const server = setupServer(
  rest.get('/files', (_, res, ctx) => {
    filesEndpointCalledCount += 1;
    return res(
      ctx.json({
        files: [
          {
            name: 'DEFAULT /files HANDLER',
            size: 1,
            id: 'RENDERED',
            uploadTime: new Date(),
            expireTime: new Date(),
          },
        ],
      }),
    );
  }),
  rest.delete('/deleteexpired', (_, res, ctx) =>
    res(ctx.json({ farking: true })),
  ),
);

beforeAll(() => server.listen());
afterEach(async () => {
  numTestsRanCount += 1;
  while (filesEndpointCalledCount !== numTestsRanCount) {
    /* eslint-disable no-await-in-loop */
    await new Promise((r) => setTimeout(r, 100));
  }
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('app', () => {
  test('renders title', () => {
    render(<App />);
    const titleElement = screen.getByText(/baton/i);
    expect(titleElement).toBeInTheDocument();
  });

  // The emoji had to be put in its own container instead of being next to the
  // 'baton' text because it would have trouble rendering if we tried italicizing
  // it.
  test('renders baton emoji', () => {
    render(<App />);
    const titleElement = screen.getByText(/🪄/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders table', () => {
    render(<App />);
    const tableElement = screen.getByRole('table');
    expect(tableElement).toBeInTheDocument();
  });

  test('renders write-a-file button', () => {
    render(<App />);
    const writeAFileButton = screen.getByText(/Write a file/);
    expect(writeAFileButton).toBeInTheDocument();
  });

  test('renders upload-a-file button', () => {
    render(<App />);
    const uploadAFileButton = screen.getByText(/Upload a file/);
    expect(uploadAFileButton).toBeInTheDocument();
  });

  test('toggles text entry UI when write-a-file is clicked', () => {
    render(<App />);

    const textArea = screen.getByRole('textbox');
    expect(textArea).toBeInTheDocument();
    const uploadContentsFileButton = screen.getByText(/Upload contents/);
    expect(uploadContentsFileButton).toBeInTheDocument();

    // Before clicking, the text area and submit button should not be visible:
    // Unfortunately, Tailwind primitives aren't expanded to their real css
    // properties for tests, so we can't use expect(element).not.toBeVisible().
    expect(Object.values(textArea.parentElement!.classList)).toContain(
      'invisible',
    );
    expect(
      Object.values(uploadContentsFileButton.parentElement!.classList),
    ).toContain('invisible');

    const writeAFileButton = screen.getByText(/Write a file/);

    // Due to the note above about how Tailwind primitives aren't expanded
    // during tests, expect(textArea).toBeVisible() will actually _pass_ at
    // first, despite the component being invisible in reality. This is because
    // jest-dom has no understanding of what 'invisible' (from Tailwind) means.
    // Because of this, we want to click _twice_ to ensure that the expected
    // state is _not_ what was _already_ passing, because otherwise we could be
    // accidentally passing the test.
    writeAFileButton.click(); // Visible.
    writeAFileButton.click(); // Invisible.
    // NOTE: .not.toBeVisible() works now because the React code we use to
    // toggle visibility actually changes the style of the component directly,
    // since it will run after Tailwind has already executed. Therefore, the
    // criteria for toBeVisible() is checked as expected.
    expect(textArea).not.toBeVisible();
    expect(uploadContentsFileButton).not.toBeVisible();

    // The next click should have caused the textarea and submit button to
    // become visible again:
    writeAFileButton.click();
    expect(textArea).toBeVisible();
    expect(uploadContentsFileButton).toBeVisible();
  });

  test('displays expected files from API', async () => {
    const files = Array(10)
      .fill(0)
      .map((_, i) => ({
        id: i.toString(),
        name: i.toString(),
        size: i,
        uploadTime: new Date(),
        expireTime: addDays(new Date(), 1),
      }));
    // We need to keep the value < 1000, or else we will pretty-print the
    // filesize into kB instead of just B.
    expect(files.length).toBeLessThan(1000);
    const filesEndpointMock = jest.fn(() => ({ files }));
    server.use(
      rest.get('/files', (_, res, ctx) => {
        filesEndpointCalledCount += 1;
        return res(ctx.json(filesEndpointMock()));
      }),
      rest.delete('/deleteexpired', (_, res, ctx) =>
        res(ctx.json({ farking: false })),
      ),
    );

    render(<App />);

    // Wait for React to paint the data in the rows.
    await waitFor(() => {
      files.forEach((file, i) => {
        expect(screen.getByText(file.name)).toBeInTheDocument();
        expect(screen.getByText(`(${file.size} B)`)).toBeInTheDocument();
        const uploadTimeElements = screen.getAllByText(
          format(file.uploadTime, 'MMMM do, p'),
        );
        expect(uploadTimeElements).toHaveLength(files.length);
        expect(uploadTimeElements[i]).toBeInTheDocument();

        const expireTimeDurationElements = screen.getAllByText(
          formatDuration(
            intervalToDuration({
              start: new Date(),
              end: file.expireTime,
            }),
            { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
          ),
        );
        expect(expireTimeDurationElements).toHaveLength(files.length);
        expect(expireTimeDurationElements[i]).toBeInTheDocument();
      });
    });

    expect(filesEndpointMock).toHaveBeenCalledTimes(1);
  });

  test('deleted expected file', async () => {
    const originalFile = {
      id: 'test',
      name: 'test',
      size: 10,
      uploadTime: new Date(),
      expireTime: addDays(new Date(), 1),
    };
    // Because we do not have a database, we just use this flag to denote if the
    // file has been deleted or not. If it has been deleted, we do not return it
    // from /files, otherwise we do.
    server.use(
      rest.get('/files', (_, res, ctx) => {
        filesEndpointCalledCount += 1;
        return res(ctx.json({ files: [originalFile] }));
      }),
      rest.delete('/delete/:fileID', (req, res, ctx) => {
        expect(req.params.fileID).toEqual(originalFile.id);
        return res(ctx.json({ id: req.params.fileID }));
      }),
    );

    render(<App />);

    // Wait for React to paint the Delete button.
    await waitFor(() => {
      const deleteButton = screen.getByText(/Delete/);
      expect(deleteButton).toBeInTheDocument();
      deleteButton.click();
    });

    // Wait for React to delete the row.
    await waitFor(() => {
      expect(screen.queryByText(originalFile.name)).toBeNull();
      expect(screen.queryByText(`(${originalFile.size} B)`)).toBeNull();
      expect(
        screen.queryByText(format(originalFile.uploadTime, 'MMMM do, p')),
      ).toBeNull();

      expect(
        screen.queryByText(
          formatDuration(
            intervalToDuration({
              start: new Date(),
              end: originalFile.expireTime,
            }),
            { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
          ),
        ),
      ).toBeNull();
    });
  });

  // NOTE: We do not test the download button. This is unfortunate, but it is
  // because the action we take on click for the download button does some hacky
  // thing which changes the window href. I'm not exactly sure why, but doing
  // this causes the test to hang.
  // test('downloads expected file', () => {})

  describe('upload', () => {
    // So, this test is not complete in that our /upload endpoint is not using
    // the actual data we should be getting back from our React code. The reason
    // for this is because the react code is meant to run in a browser, where
    // the FormData & File type exist. To use it in node, we'd have to polyfill
    // that, and I'm not even sure how to do it. I tried with quite a few
    // polyfill implementations but there were always either issues
    // compiling/running Jest with them (e.g. import vs. require issues) or got
    // weird and wasn't exactly consistent with the browser behavior.

    function startServer(): () => {
      filesCalled: boolean;
      uploadCalled: boolean;
    } {
      // It is possible that /files gets called for the first time _after_ /upload
      // gets called. If this happens, then we won't be testing that our upload is
      // properly updating the state, we'll just be making sure we update the
      // state accordingly with the backend, which is a separate test.
      let filesCalled = false;
      let uploadCalled = false;
      const fileContents = 'text';

      server.use(
        rest.get('/files', (_, res, ctx) => {
          filesEndpointCalledCount += 1;
          filesCalled = true;
          if (uploadCalled) {
            return res(
              ctx.json({
                files: [
                  {
                    name: `${fileContents}.txt`,
                    size: fileContents.length,
                    id: uuidv4(),
                    uploadTime: new Date().toISOString(),
                    expireTime: new Date().toISOString(),
                  },
                ],
              }),
            );
          }

          return res(ctx.json({ files: [] }));
        }),
        rest.post('/upload', (_, res, ctx) => {
          uploadCalled = true;
          return res(
            ctx.json({
              name: `${fileContents}.txt`,
              size: fileContents.length,
              id: uuidv4(),
              uploadTime: new Date().toISOString(),
              expireTime: new Date().toISOString(),
            }),
          );
        }),
      );

      return () => ({ filesCalled, uploadCalled });
    }

    test('file', async () => {
      const getEndpointCalledStatuses = startServer();
      const fileContents = 'text';

      render(<App />);

      await waitFor(() => {
        expect(getEndpointCalledStatuses().filesCalled).toBeTruthy();
      });

      await waitFor(() => {
        // Wait for React to paint the Upload button.
        const uploadButton = screen.getByText(/Upload a file/);
        expect(uploadButton).toBeInTheDocument();
        act(() => {
          userEvent.click(uploadButton);
        });

        const inputElement = screen.getByTestId('hidden-input-element');
        const fileToUpload = new File(['hello'], 'hello.txt', { type: 'text' });
        act(() => {
          userEvent.upload(inputElement, fileToUpload);
        });
      });

      await waitFor(() => {
        expect(getEndpointCalledStatuses().uploadCalled).toBeTruthy();
        expect(screen.getByText(`${fileContents}.txt`)).toBeInTheDocument();
      });
    });

    test('custom contents', async () => {
      const getEndpointCalledStatuses = startServer();
      const fileContents = 'text';
      render(<App />);

      await waitFor(() => {
        expect(getEndpointCalledStatuses().filesCalled).toBeTruthy();
      });

      // Wait for React to paint the Upload button.
      await waitFor(() => {
        const writeAFileButton = screen.getByText(/Write a file/);
        writeAFileButton.click();
        const textArea = screen.getByRole('textbox');
        act(() => {
          userEvent.type(textArea, fileContents);
        });
        expect(textArea).toHaveValue(fileContents);
        const uploadContentsButton = screen.getByText(/Upload contents/);
        uploadContentsButton.click();
      });

      // See the explanatory comment in the upload file test case for why this
      // test is simpler than it should be.
      await waitFor(() => {
        expect(getEndpointCalledStatuses().uploadCalled).toBeTruthy();
        expect(screen.getByText(`${fileContents}.txt`)).toBeInTheDocument();
      });
    });
  });
});
