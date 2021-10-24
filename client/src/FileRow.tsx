import './index.css';
import file from './types';

function FileRow(f: file) {
  const { filename } = f;
  const { filesize } = f;
  const { uploadTime } = f;
  const { expireTime } = f;

  return (
    <tr className="border-b hover:shadow-md">
      <th className="font-normal p-1 text-left px-10">
        <div className="font-bold font-mono">{filename}</div>
        <div className="text-xs italic">({filesize})</div>
      </th>
      <th className="font-normal border-b text-left  px-10">
        <div className="italic">{uploadTime}</div>
      </th>
      <th className="font-normal border-b text-left px-10">
        <div className="italic">{expireTime}</div>
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
          className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-red-500 hover:text-blue-100"
        >
          Delete
        </button>
      </th>
    </tr>
  );
}

export default FileRow;
