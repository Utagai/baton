import { format, formatDuration, intervalToDuration } from 'date-fns';
import prettyBytes from 'pretty-bytes';

import './index.css';
import file from './types';

function handleDelete(id: string, deleteFile: (innerId: string) => void) {
  fetch(`/delete/${id}`, {
    method: 'DELETE',
  })
    .then(async (resp) => {
      console.log('response from backend: ', await resp.text());
      deleteFile(id);
    })
    .catch((err) => console.log(`error from /delete call: ${err}`));
}

function FileRow(props: { f: file; deleteFile: (id: string) => void }) {
  const {
    f: { id, filename, filesize, uploadTime, expireTime },
    deleteFile,
  } = props;

  const uploadTimeHumanReadable = format(Date.parse(uploadTime), 'MMMM do, p');
  const expireTimeLeft = formatDuration(
    intervalToDuration({
      start: new Date(),
      end: Date.parse(expireTime),
    }),
    { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
  );

  return (
    <tr className="border-b hover:shadow-md" key={id}>
      <th className="font-normal p-1 text-left px-10">
        <div className="font-bold font-mono">{filename}</div>
        <div className="text-xs italic">({prettyBytes(filesize)})</div>
      </th>
      <th className="font-normal border-b text-left  px-10">
        <div className="italic">{uploadTimeHumanReadable}</div>
      </th>
      <th className="font-normal border-b text-left px-10">
        <div className="italic">{expireTimeLeft}</div>
      </th>
      <th className="font-normal border-b">
        <button
          aria-label="Download"
          type="button"
          className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-gray-500 hover:text-blue-100"
        >
          Download
        </button>
        <button
          aria-label="Delete"
          type="button"
          onClick={() => handleDelete(id, deleteFile)}
          className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-red-500 hover:text-blue-100"
        >
          Delete
        </button>
      </th>
    </tr>
  );
}

export default FileRow;
