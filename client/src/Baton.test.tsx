import { addDays, format, formatDuration, intervalToDuration } from 'date-fns';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';
import userEvent from '@testing-library/user-event';

import Baton from './Baton';

const filesEndpointDefaultFile = {
  name: 'DEFAULT /files HANDLER',
  size: 1,
  id: 'RENDERED',
  uploadTime: new Date(),
  expireTime: new Date(),
};

const server = setupServer(
  rest.get('/files', (_, res, ctx) =>
    res(
      ctx.json({
        files: [filesEndpointDefaultFile],
      }),
    ),
  ),
  rest.delete('/deleteexpired', (_, res, ctx) => res(ctx.json({}))),
);

beforeAll(() => server.listen());
afterEach(async () => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('app', () => {
  test('renders title', () => {
    render(<Baton host="http://localhost/" />);
    const titleElement = screen.getByText(/baton/i);
    expect(titleElement).toBeInTheDocument();
  });

  // The emoji had to be put in its own container instead of being next to the
  // 'baton' text because it would have trouble rendering if we tried italicizing
  // it.
  test('renders baton emoji', () => {
    render(<Baton host="http://localhost/" />);
    const titleElement = screen.getByText(/🪄/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders table', () => {
    render(<Baton host="http://localhost/" />);
    const tableElement = screen.getByRole('table');
    expect(tableElement).toBeInTheDocument();
  });

  test('renders write-a-file button', () => {
    render(<Baton host="http://localhost/" />);
    const writeAFileButton = screen.getByText(/Write a file/);
    expect(writeAFileButton).toBeInTheDocument();
  });

  test('renders upload-a-file button', () => {
    render(<Baton host="http://localhost/" />);
    const uploadAFileButton = screen.getByText(/Upload a file/);
    expect(uploadAFileButton).toBeInTheDocument();
  });

  test('toggles text entry UI when write-a-file is clicked', () => {
    render(<Baton host="http://localhost/" />);

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
      rest.get('/files', (_, res, ctx) => res(ctx.json(filesEndpointMock()))),
    );

    render(<Baton host="http://localhost/" />);

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
      rest.get('/files', (_, res, ctx) =>
        res(ctx.json({ files: [originalFile] })),
      ),
      rest.delete('/delete/:fileID', (req, res, ctx) => {
        expect(req.params.fileID).toEqual(originalFile.id);
        return res(ctx.json({ id: req.params.fileID }));
      }),
    );

    render(<Baton host="http://localhost/" />);

    // Wait for React to paint the Delete button.
    await waitFor(() => {
      const deleteButton = screen.getByText(/🗑️ Delete/);
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
      uploadEndpointCalledCount: number;
    } {
      // It is possible that /files gets called for the first time _after_ /upload
      // gets called. If this happens, then we won't be testing that our upload is
      // properly updating the state, we'll just be making sure we update the
      // state accordingly with the backend, which is a separate test.
      let filesCalled = false;
      let uploadEndpointCalledCount = 0;
      const fileContents = 'text';

      server.use(
        rest.get('http://localhost/files', (_, res, ctx) => {
          filesCalled = true;
          return res(
            ctx.json({
              files: Array(uploadEndpointCalledCount).map(() => ({
                name: `${fileContents}.txt`,
                size: fileContents.length,
                id: uuidv4(),
                uploadTime: new Date().toISOString(),
                expireTime: new Date().toISOString(),
              })),
            }),
          );
        }),
        rest.post('http://localhost/upload', (_, res, ctx) => {
          uploadEndpointCalledCount += 1;
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

      return () => ({ filesCalled, uploadEndpointCalledCount });
    }

    test('file', async () => {
      const getEndpointCalledStatuses = startServer();
      const fileContents = 'text';

      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        expect(getEndpointCalledStatuses().filesCalled).toBeTruthy();
      });

      await waitFor(() => {
        // Wait for React to paint the Upload button.
        const uploadButton = screen.getByText(/📂 Upload a file/);
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
        expect(getEndpointCalledStatuses().uploadEndpointCalledCount).toBe(1);
        expect(screen.getByText(`${fileContents}.txt`)).toBeInTheDocument();
      });
    });

    test('more than one file', async () => {
      const getEndpointCalledStatuses = startServer();
      const fileContents = 'text';

      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        expect(getEndpointCalledStatuses().filesCalled).toBeTruthy();
      });

      await waitFor(() => {
        // Wait for React to paint the Upload button.
        const uploadButton = screen.getByText(/📂 Upload a file/);
        expect(uploadButton).toBeInTheDocument();
        act(() => {
          userEvent.click(uploadButton);
        });

        const inputElement = screen.getByTestId('hidden-input-element');
        const fileToUpload1 = new File(['hello'], 'hello1.txt', {
          type: 'text',
        });
        const fileToUpload2 = new File(['hello'], 'hello2.txt', {
          type: 'text',
        });
        act(() => {
          userEvent.upload(inputElement, [fileToUpload1, fileToUpload2]);
        });
      });

      await waitFor(() => {
        expect(getEndpointCalledStatuses().uploadEndpointCalledCount).toBe(2);
        expect(screen.getAllByText(`${fileContents}.txt`).length).toBe(2);
      });
    });

    test('custom content', async () => {
      const getEndpointCalledStatuses = startServer();
      const fileContents = 'text';
      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        expect(getEndpointCalledStatuses().filesCalled).toBeTruthy();
      });

      // Wait for React to paint the Upload button.
      await waitFor(() => {
        const writeAFileButton = screen.getByText(/📝 Write a file/);
        writeAFileButton.click();
        const textArea = screen.getByRole('textbox');
        act(() => {
          userEvent.type(textArea, fileContents);
        });
        expect(textArea).toHaveValue(fileContents);
        const uploadContentsButton = screen.getByText(/🛫 Upload contents/);
        uploadContentsButton.click();
      });

      // See the explanatory comment in the upload file test case for why this
      // test is simpler than it should be.
      await waitFor(() => {
        expect(getEndpointCalledStatuses().uploadEndpointCalledCount).toBe(1);
        expect(screen.getByText(`${fileContents}.txt`)).toBeInTheDocument();
      });
    });
  });

  describe('notifies', () => {
    // Note that we issue a variety of notifications for a variety of cases. We
    // don't really try to test every single instance of this however, since
    // there will be a bunch and possibly even more in the future, and the
    // value-add of more testing code for it doesn't seem to justify the cost.
    test('on app load', async () => {
      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/"number of files": 1/).length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    test('on /files error', async () => {
      const expectedErrDetails = {
        msg: 'uh oh',
        info: uuidv4(),
      };
      server.use(
        rest.get('/files', (_, res, ctx) =>
          res(ctx.status(500), ctx.json(expectedErrDetails)),
        ),
      );
      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch files/)).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`"msg": "${expectedErrDetails.msg}",`)),
        ).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`"info": "${expectedErrDetails.info}"`)),
        ).toBeInTheDocument();
      });
    });

    test('on /upload error for file', async () => {
      const expectedErrDetails = {
        msg: uuidv4(),
        info: uuidv4(),
      };
      server.use(
        rest.post('/upload', (_, res, ctx) =>
          res(ctx.status(500), ctx.json(expectedErrDetails)),
        ),
      );
      render(<Baton host="http://localhost/" />);

      await waitFor(() => {
        // Wait for React to paint the Upload button.
        const uploadButton = screen.getByText(/📂 Upload a file/);
        expect(uploadButton).toBeInTheDocument();
        act(() => {
          userEvent.click(uploadButton);
        });

        const inputElement = screen.getByTestId('hidden-input-element');
        const fileToUpload = new File(['hello'], 'hello.txt', {
          type: 'text',
        });
        act(() => {
          userEvent.upload(inputElement, fileToUpload);
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`"msg": "${expectedErrDetails.msg}",`)),
        ).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`"info": "${expectedErrDetails.info}"`)),
        ).toBeInTheDocument();
      });
    });

    test('on /upload error for custom content', async () => {
      const expectedErrDetails = {
        msg: uuidv4(),
        info: uuidv4(),
      };
      server.use(
        rest.post('/upload', (_, res, ctx) =>
          res(ctx.status(500), ctx.json(expectedErrDetails)),
        ),
      );
      render(<Baton host="http://localhost/" />);

      const fileContents = 'hello';
      await waitFor(() => {
        const writeAFileButton = screen.getByText(/📝 Write a file/);
        writeAFileButton.click();
        const textArea = screen.getByRole('textbox');
        act(() => {
          userEvent.type(textArea, fileContents);
        });
        expect(textArea).toHaveValue(fileContents);
        const uploadContentsButton = screen.getByText(/🛫 Upload contents/);
        uploadContentsButton.click();
      });

      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`"msg": "${expectedErrDetails.msg}",`)),
        ).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`"info": "${expectedErrDetails.info}"`)),
        ).toBeInTheDocument();
      });
    });

    test('on /delete error', async () => {
      const expectedErrDetails = {
        msg: uuidv4(),
        info: uuidv4(),
      };
      // Because we do not have a database, we just use this flag to denote if the
      // file has been deleted or not. If it has been deleted, we do not return it
      // from /files, otherwise we do.
      server.use(
        rest.delete(`/delete/:fileID`, (_, res, ctx) =>
          res(ctx.status(500), ctx.json(expectedErrDetails)),
        ),
      );

      render(<Baton host="http://localhost/" />);

      // Wait for React to paint the Delete button.
      await waitFor(() => {
        const deleteButton = screen.getByText(/🗑️ Delete/);
        expect(deleteButton).toBeInTheDocument();
        deleteButton.click();
      });

      // Wait for React to delete the row.
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`"msg": "${expectedErrDetails.msg}",`)),
        ).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`"info": "${expectedErrDetails.info}"`)),
        ).toBeInTheDocument();
      });
    });
  });
});
