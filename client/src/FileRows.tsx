import React from 'react';
// import logo from './logo.svg';
import './index.css';
import './App.css';
import debounce from 'lodash.debounce';

async function callBackendAPI() {
  const response = await fetch('/express_backend');
  const body = await response.json();

  if (response.status !== 200) {
    throw Error(body.message);
  }
  return body;
}

function FileRows() {
  const [data, setData] = React.useState([]);

  const debouncedCall = React.useCallback(
    debounce(callBackendAPI, 250, { leading: true }),
    [],
  );

  React.useEffect(() => {
    const resp = debouncedCall();
    while (resp === undefined) {
      throw Error('TODO');
    }
    resp
      .then((res) => {
        if (res !== undefined) {
          setData(res.express);
        }
      })
      .catch((err) => console.log(err));
  });

  console.log('HELLO WORLD!');
  type file = {
    filename: string;
    filesize: string;
    uploadTime: string;
    expireTime: string;
  };
  const rows = data.map((f: file) => (
    <tr className="border-b hover:shadow-md">
      <th className="font-normal p-1 text-left px-10">
        <div className="font-bold font-mono">{f.filename}</div>
        <div className="text-xs italic">({f.filesize})</div>
      </th>
      <th className="font-normal border-b text-left  px-10">
        <div className="italic">{f.uploadTime}</div>
      </th>
      <th className="font-normal border-b text-left px-10">
        <div className="italic">{f.expireTime}</div>
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
          aria-label="Download"
          type="button"
          className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-red-500 hover:text-blue-100"
        >
          Delete
        </button>
      </th>
    </tr>
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
