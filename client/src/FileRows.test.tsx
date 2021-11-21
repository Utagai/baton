import { render, within } from '@testing-library/react';
import FileRows from './FileRows';

describe('FileRows', () => {
  test('renders correct number of file rows', () => {
    const numFiles = 10;
    const files = Array(numFiles)
      .fill(0)
      .map((_, i) => ({
        id: i.toString(),
        name: i.toString(),
        size: i,
        uploadTime: `2021-01-06T22:57:46.162Z`,
        expireTime: `2021-02-06T22:57:46.162Z`,
      }));
    const table = document.createElement('table');
    const { container } = render(
      <FileRows metadatas={files} deleteMetadataFromState={() => {}} />,
      {
        container: document.body.appendChild(table),
      },
    );

    const fileRowElements = within(container).getAllByRole('row');
    fileRowElements.forEach((fileRow) => {
      expect(fileRow).toBeInTheDocument();
    });
    expect(fileRowElements).toHaveLength(numFiles);
  });
});
