import { render, within } from '@testing-library/react';
import TableHeader from './TableHeader';

describe('TableHeader', () => {
  test('renders the correct column names', () => {
    const table = document.createElement('table');
    const { container } = render(<TableHeader />, {
      container: document.body.appendChild(table),
    });

    const headers = within(container).getAllByRole('columnheader');
    expect(headers.map((elem) => elem.textContent)).toEqual([
      'File',
      'Uploaded At',
      'Expires In',
      '',
    ]);
  });
});
