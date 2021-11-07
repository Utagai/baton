import './index.css';
import FileRow from './FileRow';
import file from './types';

function FileRows(props: { files: file[]; deleteFile: (id: string) => void }) {
  const { files, deleteFile } = props;
  const rows = files.map((f: file) => (
    <FileRow key={f.id} f={f} deleteFileFromState={deleteFile} />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
