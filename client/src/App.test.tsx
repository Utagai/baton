import { render, screen } from '@testing-library/react';
import App from './App';

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

  test('should toggle text entry UI when write-a-file is clicked', () => {
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
});
