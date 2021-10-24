import React, { useRef } from 'react';
import './index.css';
import { v4 as uuidv4 } from 'uuid';

function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
    const file = files.item(i);
    if (file === null) {
      console.log('skipping file...');
      // Nothing else we can do.
      continue;
    }

    const formData = new FormData();
    formData.append('filename', file.name);
    formData.append('filesize', file.size.toString());
    formData.append('id', uuidv4());
    formData.append('file', file);
    uploadRequests.push(
      fetch('/upload', {
        method: 'POST',
        body: formData,
      }),
    );
  }

  console.log('upload reqs: ', uploadRequests);
  Promise.all(uploadRequests)
    .then((resp) => console.log('all reqs res: ', resp[0].json()))
    .catch((err) => console.log('err from upload: ', err));
}

function UploadButtons() {
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-1/2 my-3 mx-10">
      <div className="grid place-items-center">
        <span>
          <button
            aria-label="Write a file"
            type="button"
            className="border font-semibold rounded-sm text-gray-700 bg-gray-50 px-4 py-2 m-1 hover:bg-gray-500 hover:text-gray-50"
          >
            📝 Write a file
          </button>
          <button
            aria-label="Upload a file"
            type="button"
            className="border font-semibold rounded-sm text-gray-700 bg-gray-50 px-4 py-2 m-1 hover:bg-gray-500 hover:text-gray-50"
            // This just makes it so that we trigger the click action on our
            // invisible file input. Once we've done that, the real action happens in
            // the invisible input's onclick handler.
            onClick={() => fileUploadInputRef.current?.click()}
          >
            📂 Upload a file
          </button>
          <input
            className="hidden"
            type="file"
            ref={fileUploadInputRef}
            onChange={handleUpload}
            multiple
          />
        </span>
      </div>
    </div>
  );
}

export default UploadButtons;
