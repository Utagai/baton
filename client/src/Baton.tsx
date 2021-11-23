import React from 'react';

import './index.css';
import Banner from './Banner';
import Table from './Table';
import UploadButtons from './UploadButtons';
import CustomText from './CustomText';
import FileMetadata from './FileMetadata';
import { error, info } from './Notify';

async function callBackendAPI(endpoint: string, method: string) {
  const response = await fetch(endpoint, { method });
  const body = await response.json();

  if (response.status !== 200) {
    return Promise.reject(body);
  }

  return body;
}

async function getCurrentFileMetadatas(): Promise<{ files: FileMetadata[] }> {
  // TODO: We should not be calling /deleteexpired here because it overloads the
  // responsibilities of this function. We should only be returning /files. The
  // /deleteexpired should either:
  //  * Be running in a standalone process on the box. (best option)
  //  * Be running in the refresh thread.
  await callBackendAPI('deleteexpired', 'DELETE');
  return callBackendAPI('files', 'GET');
}

function tableElem(
  metadatas: FileMetadata[],
  setMetadatas: (newMetadatas: FileMetadata[]) => void,
) {
  return (
    <Table
      metadatas={metadatas}
      deleteMetadataFromState={(metadataId: string) => {
        setMetadatas(
          metadatas.filter((metadata) => metadata.id !== metadataId),
        );
      }}
    />
  );
}

function uploadButtonsElem(
  pushMetadatas: (newMetadata: FileMetadata) => void,
  writeAFileOnClick: () => void,
) {
  return (
    <UploadButtons
      addMetadataToState={(metadata: FileMetadata) => {
        pushMetadatas(metadata);
      }}
      writeAFileOnClick={writeAFileOnClick}
    />
  );
}

function customTextElem(
  pushMetadatas: (newMetadata: FileMetadata) => void,
  textInputRef: React.RefObject<HTMLDivElement>,
) {
  return (
    <CustomText
      textInputAreaRef={textInputRef}
      addMetadataToState={(metadata: FileMetadata) => {
        pushMetadatas(metadata);
      }}
    />
  );
}

function onMount(setMetadatas: (metdatas: FileMetadata[]) => void) {
  return () => {
    let mounted = true;
    getCurrentFileMetadatas()
      .then((resp) => {
        if (resp !== undefined && mounted) {
          setMetadatas(resp.files);
          info('fetched files', { 'number of files': resp.files.length });
        }
      })
      .catch((err) => {
        error('failed to fetch files', err);
      });

    // We have to return this weird clean-up function because it is possible
    // that while handling getCurrentFiles()' promise, the component is
    // unmounted. If that happens, mounted will become false because this
    // clean-up function is called. Using this boolean then lets us avoid
    // setting state on an unmounted component.
    // Finally, note that this is for our root component. However, since baton
    // is a SPA, this root component will actually _never_ unmount. Therefore,
    // this code is actually just written to get rid of a warning & there is
    // no real issue here. If the warning came from a lower-level component,
    // then the answer would be to move up the state handling to a
    // higher-level component or use pub/sub.
    return () => {
      mounted = false;
    };
  };
}

const Baton = () => {
  const [metadatas, setMetadatas] = React.useState<FileMetadata[]>([]);
  const textInputRef = React.useRef<HTMLDivElement>(null);

  // useEffect with a state of [] runs only once, at mount time.
  React.useEffect(onMount(setMetadatas), []);

  const writeAFileOnClick = () => {
    // Toggle the display visibility of the writing section div.
    /* istanbul ignore next */
    if (textInputRef.current === null) {
      return;
    }

    const currentVisibilitySetting = textInputRef.current.style.visibility;
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
  };

  const pushMetadata = (newMetadata: FileMetadata) => {
    setMetadatas((pastMetadatas: FileMetadata[]) =>
      pastMetadatas.concat(newMetadata),
    );
  };

  return (
    <div className="grid place-items-center">
      <Banner />

      {tableElem(metadatas, setMetadatas)}

      {uploadButtonsElem(pushMetadata, writeAFileOnClick)}

      {customTextElem(pushMetadata, textInputRef)}
    </div>
  );
};

export default Baton;
