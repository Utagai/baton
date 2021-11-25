import React from 'react';

import './index.css';
import { BackendClient } from './BackendClient';
import Banner from './Banner';
import Table from './Table';
import UploadButtons from './UploadButtons';
import CustomText from './CustomText';
import FileMetadata from './FileMetadata';
import { error, info } from './Notify';

function tableElem(
  backendClient: BackendClient,
  metadatas: FileMetadata[],
  setMetadatas: (newMetadatas: FileMetadata[]) => void,
) {
  return (
    <Table
      backendClient={backendClient}
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
  backendClient: BackendClient,
  pushMetadatas: (newMetadata: FileMetadata) => void,
  writeAFileOnClick: () => void,
) {
  return (
    <UploadButtons
      backendClient={backendClient}
      addMetadataToState={(metadata: FileMetadata) => {
        pushMetadatas(metadata);
      }}
      writeAFileOnClick={writeAFileOnClick}
    />
  );
}

function customTextElem(
  backendClient: BackendClient,
  pushMetadatas: (newMetadata: FileMetadata) => void,
  textInputRef: React.RefObject<HTMLDivElement>,
) {
  return (
    <CustomText
      backendClient={backendClient}
      textInputAreaRef={textInputRef}
      addMetadataToState={(metadata: FileMetadata) => {
        pushMetadatas(metadata);
      }}
    />
  );
}

function onMount(
  backendClient: BackendClient,
  setMetadatas: (metdatas: FileMetadata[]) => void,
) {
  return () => {
    let mounted = true;
    backendClient
      .getMetadatas()
      .then((metadatas) => {
        if (metadatas !== undefined && mounted) {
          setMetadatas(metadatas);
          info('fetched files', { 'number of files': metadatas.length });
        }
      })
      .catch((err) => {
        console.log(err);
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

const Baton = (props: { host: string; antiCSRFToken: string }) => {
  const [metadatas, setMetadatas] = React.useState<FileMetadata[]>([]);
  const textInputRef = React.useRef<HTMLDivElement>(null);

  const { host, antiCSRFToken } = props;

  const backendClient = new BackendClient(host, antiCSRFToken);

  // useEffect with a state of [] runs only once, at mount time.
  React.useEffect(onMount(backendClient, setMetadatas), []);

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

  // TODO: I think what I'm realizing now is that once we start passing in the
  // backend client we are passing in an unnecessary variable. We can just pass
  // in a function for each interactable e.g. button, that does both the state
  // updates _and_ the backend call. Furthermore, it means state is only changed
  // in this one file, which is probably easier to track?
  return (
    <div className="grid place-items-center">
      <Banner />

      {tableElem(backendClient, metadatas, setMetadatas)}

      {uploadButtonsElem(backendClient, pushMetadata, writeAFileOnClick)}

      {customTextElem(backendClient, pushMetadata, textInputRef)}
    </div>
  );
};

export default Baton;
