import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import FileMetadata from './FileMetadata';
import Button from './Button';
import { error, success } from './Notify';

function createFileNameFromContent(content: string): string {
  return `${content
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .split(' ')
    .slice(0, 5)
    .join('_')}.txt`;
}

function uploadContentToBackend(
  textAreaText: string,
  addMetadataToState: (f: FileMetadata) => void,
) {
  const textAreaBlob = new Blob([textAreaText]);

  const formData = new FormData();
  const customFilename = createFileNameFromContent(textAreaText);
  formData.append('name', customFilename);
  formData.append('size', `${textAreaBlob.size}`);
  formData.append('id', uuidv4());
  formData.append('file', textAreaBlob);
  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    // A little bit of cleverness. We return a single promise that is a tuple of
    // the JSON body + status code, so that when we handle the JSON body, we have
    // the context of the response's status code to determine if the JSON body is
    // actual metadata or a document describing error.
    // TODO: De-dupe this upload logic.
    .then((resp) => Promise.all([resp.json(), Promise.resolve(resp.status)]))
    .then(([json, statusCode]: [any, number]) => {
      if (statusCode === 200) {
        addMetadataToState(json);
        return success('uploaded custom text', { filename: customFilename });
      }
      return Promise.reject(json);
    })
    .catch((err) => error('failed to upload', err));
}

function textAreaElem(setTextAreaText: (text: string) => void) {
  return (
    <textarea
      placeholder=" ..."
      onChange={(event) => {
        setTextAreaText(event.target.value);
      }}
      className="border-2 block border-gray-400 w-1/2 rounded-sm"
    />
  );
}

function uploadButtonElem(
  textInputAreaRef: React.RefObject<HTMLDivElement>,
  textAreaText: string,
  addMetadataToState: (f: FileMetadata) => void,
) {
  return (
    <Button
      ariaLabel="Upload contents"
      onClick={() => {
        if (textInputAreaRef !== null) {
          uploadContentToBackend(textAreaText, addMetadataToState);
        }
      }}
    >
      🛫 Upload contents
    </Button>
  );
}

function CustomText(props: {
  textInputAreaRef: React.RefObject<HTMLDivElement>;
  addMetadataToState: (f: FileMetadata) => void;
}) {
  const [textAreaText, setTextAreaText] = React.useState<string>('');
  const { textInputAreaRef, addMetadataToState } = props;

  return (
    <div
      ref={textInputAreaRef}
      className="w-1/2 grid place-items-center invisible"
    >
      {textAreaElem(setTextAreaText)}
      {uploadButtonElem(textInputAreaRef, textAreaText, addMetadataToState)}
    </div>
  );
}

export default CustomText;
