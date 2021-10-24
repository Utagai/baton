import './index.css';
import Table from './Table';

const App = () => (
  <div className="grid place-items-center">
    <div className="text-6xl font-extrabold mx-10 my-5 text-gray-800">
      <h1 className="inline-block italic font-extralight">baton</h1>
      <span className="">🪄</span>
    </div>

    <Table />

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
  </div>
);

export default App;
