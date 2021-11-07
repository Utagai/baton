import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// TODO: Is it actually good practice to have a types.ts?
import file from './types';
import Button from './Button';

function handleUpload(
  textInputAreaRef: React.RefObject<HTMLDivElement>,
  textAreaText: string,
  addFileToState: (f: file) => void,
) {
  if (textInputAreaRef.current !== null) {
    const textAreaBytes = new TextEncoder().encode(textAreaText);

    const formData = new FormData();
    formData.append(
      'filename',
      `${textAreaText
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .split(' ')
        .slice(0, 5)
        .join('_')}.txt`,
    );
    formData.append('filesize', `${textAreaBytes.length}`);
    formData.append('id', uuidv4());
    formData.append('file', new Blob([textAreaBytes]));
    fetch('/upload', {
      method: 'POST',
      body: formData,
    })
      .then(async (resp) => {
        if (!resp.ok) {
          throw new Error('failed to upload custom content');
        }
        return resp.json();
      })
      .then((f) => {
        console.log('req res: ', f);
        addFileToState(f);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

function CustomText(props: {
  textInputAreaRef: React.RefObject<HTMLDivElement>;
  addFileToState: (f: file) => void;
}) {
  const [textAreaText, setTextAreaText] = React.useState<string>('');
  const { textInputAreaRef, addFileToState } = props;

  return (
    <div
      ref={textInputAreaRef}
      className="w-1/2 grid place-items-center invisible"
    >
      <textarea
        placeholder="   ..."
        onChange={(event) => {
          setTextAreaText(event.target.value);
        }}
        className="border-2 block border-gray-400 w-1/2 rounded-sm"
      />

      <Button
        text="🛫 Upload contents"
        ariaLabel="Upload contents"
        onClick={() => {
          handleUpload(textInputAreaRef, textAreaText, addFileToState);
        }}
      />
    </div>
  );
}

export default CustomText;
