import { addDays, format, formatDuration, intervalToDuration } from 'date-fns';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const server = setupServer(
  rest.get('/files', (_, res, ctx) => res(ctx.json({ files: [] }))),
  rest.delete('/deleteexpired', (_, res, ctx) => res(ctx.json({}))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
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
    const writeAFileButton = screen.getByText('📝 Write a file');
    expect(writeAFileButton).toBeInTheDocument();
  });

  test('renders upload-a-file button', () => {
    render(<App />);
    const uploadAFileButton = screen.getByText('📂 Upload a file');
    expect(uploadAFileButton).toBeInTheDocument();
  });

  test('toggles text entry UI when write-a-file is clicked', () => {
    render(<App />);

    const textArea = screen.getByRole('textbox');
    expect(textArea).toBeInTheDocument();
    const uploadContentsFileButton = screen.getByText('🛫 Upload contents');
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

    const writeAFileButton = screen.getByText('📝 Write a file');

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
    const fileReturnerMock = jest.fn(() => ({ files }));
    server.use(
      rest.get('/files', (_, res, ctx) => res(ctx.json(fileReturnerMock()))),
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

    expect(fileReturnerMock).toHaveBeenCalledTimes(1);
  });

  test('displays expected files from API', async () => {
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

    render(<App />);

    // Wait for React to paint the Delete button.
    await waitFor(() => {
      const deleteButton = screen.getByText('🗑️ Delete');
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
});
