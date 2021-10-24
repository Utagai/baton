import React from 'react';
import './index.css';
import debounce from 'lodash.debounce';
import FileRow from './FileRow';

async function callBackendAPI() {
  const response = await fetch('/files');
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
          setData(res.files);
        }
      })
      .catch((err) => console.log(err));
  });

  console.log('HELLO WORLD!');
  type file = {
    filename: string;
    filesize: number;
    uploadTime: string;
    expireTime: string;
  };
  const rows = data.map((f: file) => (
    <FileRow
      filename={f.filename}
      filesize={f.filesize}
      uploadTimeStr={f.uploadTime}
      expireTimeStr={f.expireTime}
    />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
