import './index.css';
import { BackendClient } from './BackendClient';
import FileRow from './FileRow';
import FileMetadata from './FileMetadata';

function FileRows(props: {
  backendClient: BackendClient;
  metadatas: FileMetadata[];
  deleteMetadataFromState: (fileId: string) => void;
}) {
  const { backendClient, metadatas, deleteMetadataFromState } = props;
  const rows = metadatas.map((metadata: FileMetadata) => (
    <FileRow
      key={metadata.id}
      backendClient={backendClient}
      metadata={metadata}
      deleteMetadataFromState={deleteMetadataFromState}
    />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
