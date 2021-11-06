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

  test('renders the expected columns on table', () => {
    render(<App />);
    const headerElements = screen.getAllByRole('columnheader');
    headerElements.forEach((elem) => {
      expect(elem).toBeInTheDocument();
    });
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

  test('should show text entry UI when write-a-file is clicked', () => {
    render(<App />);
    // Before clicking, the text area and submit button should not be visible:
    // Unfortunately, tailwind primitives aren't expanded to their real css
    // properties, so we can't use expect(element).not.toBeVisible().
    expect(
      Object.values(screen.getByRole('textbox').parentElement!.classList),
    ).toContain('invisible');
    expect(
      Object.values(
        screen.getByText('🛫 Upload contents').parentElement!.classList,
      ),
    ).toContain('invisible');

    const writeAFileButton = screen.getByText('📝 Write a file');
    writeAFileButton.click();

    // The click should have caused the textarea and submit button to become
    // visible:
    const textArea = screen.getByRole('textbox');
    expect(textArea).toBeInTheDocument();

    const uploadContentsFileButton = screen.getByText('🛫 Upload contents');
    expect(uploadContentsFileButton).toBeInTheDocument();
  });
});
