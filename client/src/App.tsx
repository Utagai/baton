import './index.css';
import FileRows from './FileRows';
import TableHeader from './TableHeader';

const App = () => (
  <div className="grid place-items-center">
    <div className="text-6xl font-extrabold mx-10 my-5 text-gray-800">
      <h1 className="inline-block italic font-extralight">baton</h1>
      <span className="">🪄</span>
    </div>
    <div className="w-1/2 border-4 border-gray-200 rounded-sm mx-10">
      <table className="min-w-full mx-auto rounded-md bg-gray-50 text-gray-700">
        <TableHeader />

        <FileRows />
      </table>
    </div>
  </div>
);

export default App;
