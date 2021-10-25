import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// TODO: Is it actually good practice to have a types.ts?
import file from './types';

function CustomText(props: {
  textInputAreaRef: React.RefObject<HTMLDivElement>;
  addFile: (f: file) => void;
}) {
  const [textAreaText, setTextAreaText] = React.useState<string>('');
  const { textInputAreaRef, addFile } = props;

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

      <button
        type="button"
        className="border block font-semibold rounded-sm text-gray-700 bg-gray-50 px-4 py-2 m-1 hover:bg-gray-500 hover:text-gray-50"
        aria-label="Upload contents"
        onClick={() => {
          if (textInputAreaRef.current !== null) {
            console.log('data in text area: ', textAreaText);
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
                const f = await resp.json();
                console.log('req res: ', f);
                addFile(f);
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }}
      >
        🛫 Upload contents
      </button>
    </div>
  );
}

export default CustomText;
