import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import './index.css';
import file from './types';
import Button from './Button';

// TODO: Maybe this should exist in App.tsx and passed down here?
function handleUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  addFile: (f: file) => void,
) {
  const {
    currentTarget: { files },
  } = event;

  if (files === null) {
    // Nothing to do if so...
    return;
  }

  console.log('files chosen: ', files);

  const uploadRequests = [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files.item(i);
    if (f === null) {
      console.log('skipping file...');
      // Nothing else we can do.
      continue;
    }

    const formData = new FormData();
    formData.append('filename', f.name);
    formData.append('filesize', f.size.toString());
    formData.append('id', uuidv4());
    formData.append('file', f);
    uploadRequests.push(
      fetch('/upload', {
        method: 'POST',
        body: formData,
      }),
    );
  }

  console.log('upload reqs: ', uploadRequests);
  Promise.all(uploadRequests)
    .then((responses) => {
      responses.forEach(async (resp) => {
        const f = await resp.json();
        console.log('req res: ', f);
        if (resp.status === 200) {
          addFile(f);
        }
      });
    })
    .catch((err) => console.log('err from upload: ', err));
}

function UploadButtons(props: {
  writeFileAction: () => void;
  addFile: (f: file) => void;
}) {
  const { writeFileAction, addFile } = props;
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-1/2 mt-3 mb-1.5 mx-10">
      <div className="grid place-items-center">
        <span>
          <Button ariaLabel="Write a file" onClick={writeFileAction}>
            📝 Write a file
          </Button>
          <Button
            ariaLabel="Upload a file"
            // This just makes it so that we trigger the click action on our
            // invisible file input. Once we've done that, the real action happens in
            // the invisible input's onChange handler.
            // TODO: Is this maybe over-complicated? Maybe we can just get rid
            // of this button and style the input element in the same way, and
            // only rely on its onChange?
            onClick={() => fileUploadInputRef.current?.click()}
          >
            📂 Upload a file
          </Button>

          <input
            className="hidden"
            type="file"
            ref={fileUploadInputRef}
            onChange={(e) => {
              handleUpload(e, addFile);
            }}
            multiple
          />
        </span>
      </div>
    </div>
  );
}

export default UploadButtons;
