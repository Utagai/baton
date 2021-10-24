import './index.css';
import FileRows from './FileRows';

const App = () => (
  <div className="grid place-items-center">
    <div className="text-6xl font-extrabold mx-10 my-5 text-gray-800">
      <h1 className="inline-block italic font-extralight">baton</h1>
      <span className="">🪄</span>
    </div>
    <div className="w-1/2 border-4 border-gray-200 rounded-sm mx-10">
      <table className="min-w-full mx-auto rounded-md bg-gray-50 text-gray-700">
        <thead className="">
          <tr className="border-2 border-b-gray-500">
            <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
              File
            </th>
            <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
              Uploaded At
            </th>
            <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
              Expires In
            </th>
            <th
              aria-label="Empty column for formatting"
              className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2"
            />
          </tr>
        </thead>

        <FileRows />
      </table>
    </div>
  </div>
);

export default App;
