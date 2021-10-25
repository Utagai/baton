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
  const textInputRef = React.useRef<HTMLDivElement>(null);

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
        writeFileAction={() => {
          // Toggle the display visibility of the writing section div.
          if (textInputRef.current === null) {
            console.log('uh oh was null?');
            return;
          }

          console.log(
            `we in here baby: '${textInputRef.current.style.visibility}'`,
          );
          const currentVisibilitySetting =
            textInputRef.current.style.visibility;
          // I've seen things online where this could sometimes be 'none'
          // instead of '', so we check for both.
          if (
            currentVisibilitySetting === '' ||
            currentVisibilitySetting === 'hidden'
          ) {
            textInputRef.current.style.visibility = 'visible';
          } else {
            textInputRef.current.style.visibility = 'hidden';
          }
        }}
      />

      <div
        ref={textInputRef}
        className="w-1/2 grid place-items-center invisible"
      >
        <textarea
          placeholder="   ..."
          className="border-2 block border-gray-400 w-1/2 rounded-sm"
        />

        <button
          type="button"
          className="border block font-semibold rounded-sm text-gray-700 bg-gray-50 px-4 py-2 m-1 hover:bg-gray-500 hover:text-gray-50"
          aria-label="Upload contents"
        >
          🛫 Upload contents
        </button>
      </div>
    </div>
  );
};

export default App;
