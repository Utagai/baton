import './index.css';

const TableHeader = () => (
  <thead>
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
);

export default TableHeader;
