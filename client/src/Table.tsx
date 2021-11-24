import './index.css';
import { BackendClient } from './BackendClient';
import FileRows from './FileRows';
import TableHeader from './TableHeader';
import FileMetadata from './FileMetadata';

const Table = (props: {
  backendClient: BackendClient;
  metadatas: FileMetadata[];
  deleteMetadataFromState: (fileId: string) => void;
}) => {
  const { backendClient, metadatas, deleteMetadataFromState } = props;

  return (
    <div className="w-1/2 border-4 border-gray-200 rounded-sm mx-10">
      <table className="min-w-full mx-auto rounded-md bg-gray-50 text-gray-700">
        <TableHeader />

        <FileRows
          backendClient={backendClient}
          metadatas={metadatas}
          deleteMetadataFromState={deleteMetadataFromState}
        />
      </table>
    </div>
  );
};

export default Table;
