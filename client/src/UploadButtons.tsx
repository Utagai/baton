import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import './index.css';
import FileMetadata from './FileMetadata';
import Button from './Button';
import { error, success } from './Notify';

function uploadFileToBackend(
  file: File,
  addMetadataToState: (metadata: FileMetadata) => void,
) {
  const formData = new FormData();
  formData.set('name', file.name);
  formData.set('size', file.size.toString());
  formData.set('id', uuidv4());
  formData.set('file', file);
  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    // A little bit of cleverness. We return a single promise that is a tuple of
    // the JSON body + status code, so that when we handle the JSON body, we have
    // the context of the response's status code to determine if the JSON body is
    // actual metadata or a document describing error.
    .then((resp) => Promise.all([resp.json(), Promise.resolve(resp.status)]))
    .then(([json, statusCode]: [any, number]) => {
      if (statusCode === 200) {
        addMetadataToState(json);
        return success('filename', { filename: file.name });
      }
      return Promise.reject(json);
    })
    .catch((err) => error('failed to upload', err));
}

// This function is just useful because it gets rid of FileList | null
// and File | null from the types, and converts FileList -> File[].
function getFilesFromChangeEvent(
  event: React.ChangeEvent<HTMLInputElement>,
): File[] {
  const {
    currentTarget: { files: fileList },
  } = event;

  if (fileList === null) {
    return [];
  }

  const filesArray: File[] = [];
  for (let i = 0; i < fileList.length; i += 1) {
    const file = fileList.item(i);
    if (file === null) {
      continue;
    }

    filesArray.push(file);
  }

  return filesArray;
}

function uploadButtonsElem(
  writeAFileOnClick: () => void,
  fileUploadInputRef: React.RefObject<HTMLInputElement>,
) {
  return (
    <>
      <Button ariaLabel="Write a file" onClick={writeAFileOnClick}>
        📝 Write a file
      </Button>
      <Button
        ariaLabel="Upload a file"
        // This just makes it so that we trigger the click action on our
        // invisible file input. Once we've done that, the real action happens in
        // the invisible input's onChange handler.
        onClick={() => fileUploadInputRef.current?.click()}
      >
        📂 Upload a file
      </Button>
    </>
  );
}

function hiddenInputElem(
  fileUploadInputRef: React.RefObject<HTMLInputElement>,
  addMetadataToState: (metadata: FileMetadata) => void,
) {
  return (
    <input
      className="hidden"
      type="file"
      ref={fileUploadInputRef}
      data-testid="hidden-input-element"
      onChange={(e) => {
        getFilesFromChangeEvent(e).forEach((file) => {
          uploadFileToBackend(file, addMetadataToState);
        });
      }}
      multiple
    />
  );
}

function UploadButtons(props: {
  writeAFileOnClick: () => void;
  addMetadataToState: (metadata: FileMetadata) => void;
}) {
  const { writeAFileOnClick, addMetadataToState } = props;
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-1/2 mt-3 mb-1.5 mx-10">
      <div className="grid place-items-center">
        <span>
          {uploadButtonsElem(writeAFileOnClick, fileUploadInputRef)}
          {hiddenInputElem(fileUploadInputRef, addMetadataToState)}
        </span>
      </div>
    </div>
  );
}

export default UploadButtons;
