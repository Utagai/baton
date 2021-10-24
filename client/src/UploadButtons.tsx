import React, { useRef } from 'react';
import './index.css';

async function handleUpload(event: React.MouseEvent<HTMLInputElement>) {
  const {
    currentTarget: { files },
  } = event;

  console.log('files chosen: ', files);
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
            onClick={handleUpload}
            multiple
          />
        </span>
      </div>
    </div>
  );
}

export default UploadButtons;
