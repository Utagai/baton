import './index.css';
import FileRow from './FileRow';
import FileMetadata from './FileMetadata';

function FileRows(props: {
  metadatas: FileMetadata[];
  deleteMetadataFromState: (fileId: string) => void;
}) {
  const { metadatas, deleteMetadataFromState } = props;
  const rows = metadatas.map((metadata: FileMetadata) => (
    <FileRow
      key={metadata.id}
      metadata={metadata}
      deleteMetadataFromState={deleteMetadataFromState}
    />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
