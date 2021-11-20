import { format, formatDuration, intervalToDuration } from 'date-fns';
import prettyBytes from 'pretty-bytes';

import Button from './Button';
import './index.css';
import file from './types';

// This function won't be something we can test in jest, we'd need true E2E
// testing for it.
/* istanbul ignore next */
function handleDownload(id: string, filename: string) {
  // This is so hacky but this seems to be the nicest way to do it...
  // window.open() seems nicer but it can trigger pop-up blockers and such (and
  // at least for my own firefox set-up, firefox initially blocks it...). This
  // gives a more seamless experience.
  // TODO: On top of this already hacky business, we are hardcoding the
  // host/port of the backend.
  const url = `http://192.168.1.106:8080/download/${id}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleDelete(id: string, deleteFileFromState: (_: string) => void) {
  fetch(`/delete/${id}`, {
    method: 'DELETE',
  })
    .then(async () => {
      deleteFileFromState(id);
    })
    .catch((err) => {
      throw Error(`error from /delete call: ${err}`);
    });
}

function FileRow(props: {
  f: file;
  deleteFileFromState: (id: string) => void;
}) {
  const {
    f: { id, name, size, uploadTime, expireTime },
    deleteFileFromState,
  } = props;

  const uploadTimeHumanReadable = format(Date.parse(uploadTime), 'MMMM do, p');
  // TODO: Handle negative values here?
  const expireTimeLeft = formatDuration(
    intervalToDuration({
      start: new Date(),
      end: Date.parse(expireTime),
    }),
    { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
  );

  return (
    <tr className="border-b hover:shadow-md" key={id}>
      <td className="font-normal p-1 text-left px-10">
        <div className="font-bold font-mono">{name}</div>
        <div className="text-xs italic">({prettyBytes(size)})</div>
      </td>
      <td className="font-normal border-b text-left  px-10">
        <div className="italic">{uploadTimeHumanReadable}</div>
      </td>
      <td className="font-normal border-b text-left px-10">
        <div className="italic">{expireTimeLeft}</div>
      </td>

      <td className="font-normal border-b">
        <Button
          ariaLabel="Download"
          onClick={() => {
            // This function won't be something we can test in jest, we'd need true E2E
            // testing for it.
            /* istanbul ignore next */
            handleDownload(id, name);
          }}
        >
          💾 Download
        </Button>
        <Button
          ariaLabel="Delete"
          onClick={() => {
            handleDelete(id, deleteFileFromState);
          }}
        >
          🗑️ Delete
        </Button>
      </td>
    </tr>
  );
}

export default FileRow;
