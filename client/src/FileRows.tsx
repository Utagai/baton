import './index.css';
import FileRow from './FileRow';
import FileMetadata from './FileMetadata';

function FileRows(props: {
  files: FileMetadata[];
  deleteFile: (id: string) => void;
}) {
  const { files, deleteFile } = props;
  const rows = files.map((f: FileMetadata) => (
    <FileRow key={f.id} f={f} deleteFileFromState={deleteFile} />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
