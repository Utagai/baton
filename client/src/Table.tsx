import './index.css';
import FileRows from './FileRows';
import TableHeader from './TableHeader';
import file from './types';

const Table = (props: { files: file[]; deleteFile: (id: string) => void }) => {
  const { files, deleteFile } = props;

  return (
    <div className="w-1/2 border-4 border-gray-200 rounded-sm mx-10">
      <table className="min-w-full mx-auto rounded-md bg-gray-50 text-gray-700">
        <TableHeader />

        <FileRows files={files} deleteFile={deleteFile} />
      </table>
    </div>
  );
};

export default Table;
