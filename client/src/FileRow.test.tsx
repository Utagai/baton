import { addDays, format, formatDuration, intervalToDuration } from 'date-fns';
import { render, within } from '@testing-library/react';

import { BackendClient } from './BackendClient';
import FileRow from './FileRow';

describe('FileRow', () => {
  test('renders with expected column values', () => {
    const expectedFile = {
      id: '0',
      name: 'file',
      size: 3029,
      uploadTime: `2021-11-06T22:57:46.162Z`,
      // As long as it is in the future, we do not care. We just want the computed
      // expiration duration to be non-negative.
      expireTime: addDays(new Date(), 1).toISOString(),
    };

    const tbody = document.createElement('tbody');
    const { container } = render(
      <FileRow
        backendClient={new BackendClient('http://blah')}
        metadata={expectedFile}
        deleteMetadataFromState={() => {}}
      />,
      {
        container: document.body.appendChild(tbody),
      },
    );

    const fileRowElement = within(container).getByRole('row');
    expect(fileRowElement).toBeInTheDocument();

    expect(within(container).getByText(expectedFile.name)).toBeInTheDocument();
    expect(within(container).getByText('(3.03 kB)')).toBeInTheDocument();
    expect(
      within(container).getByText(
        format(Date.parse(expectedFile.uploadTime), 'MMMM do, p'),
      ),
    ).toBeInTheDocument();
    expect(
      within(container).getByText(
        formatDuration(
          intervalToDuration({
            start: new Date(),
            end: Date.parse(expectedFile.expireTime),
          }),
          { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
        ),
      ),
    ).toBeInTheDocument();
  });
});
