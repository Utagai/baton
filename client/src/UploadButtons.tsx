import './index.css';

function UploadButtons() {
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
          >
            📂 Upload a file
          </button>
        </span>
      </div>
    </div>
  );
}

export default UploadButtons;
