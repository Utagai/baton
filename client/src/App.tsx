import React from 'react';
import debounce from 'lodash.debounce';

import './index.css';
import Banner from './Banner';
import Table from './Table';
import UploadButtons from './UploadButtons';
import CustomText from './CustomText';
import file from './types';

async function callBackendAPI(endpoint: string, method: string) {
  const response = await fetch(endpoint, { method });
  const body = await response.json();

  if (response.status !== 200) {
    throw Error(body.message);
  }

  return body;
}

async function triggerDeletionOfExpiredFiles() {
  callBackendAPI('deleteexpired', 'DELETE');
}

async function getCurrentFiles() {
  await triggerDeletionOfExpiredFiles();
  return callBackendAPI('files', 'GET');
}

const App = () => {
  const [files, setFiles] = React.useState<file[]>([]);
  const textInputRef = React.useRef<HTMLDivElement>(null);

  const debounceInterval = 250;
  const debouncedCall = React.useCallback(
    debounce(getCurrentFiles, debounceInterval, { leading: true }),
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
            return;
          }

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

      <CustomText
        textInputAreaRef={textInputRef}
        // TODO: Is this little wrapping code around setFiles being duplicated?
        addFileToState={(f: file) => {
          setFiles(files.concat([f]));
        }}
      />
    </div>
  );
};

export default App;
