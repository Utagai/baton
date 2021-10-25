import React from 'react';
import debounce from 'lodash.debounce';

import './index.css';
import Banner from './Banner';
import Table from './Table';
import UploadButtons from './UploadButtons';
import file from './types';

async function callBackendAPI() {
  const response = await fetch('/files');
  const body = await response.json();

  if (response.status !== 200) {
    throw Error(body.message);
  }
  return body;
}

const App = () => {
  const [files, setFiles] = React.useState<file[]>([]);

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
          setFiles(res.files);
        }
      })
      .catch((err) => console.log(err));
  });

  return (
    <div className="grid place-items-center">
      <Banner />

      <Table
        files={files}
        deleteFile={(id: string) => {
          setFiles(files.filter((f) => f.id === id));
        }}
      />

      <UploadButtons
        addFile={(f: file) => {
          setFiles(files.concat([f]));
        }}
      />
    </div>
  );
};

export default App;
