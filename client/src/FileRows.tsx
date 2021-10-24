import './index.css';
import FileRow from './FileRow';
import file from './types';

function FileRows(props: { files: file[] }) {
  const { files } = props;
  console.log('HELLO WORLD!:', files);
  const rows = files.map((f: file) => (
    <FileRow
      key={f.id}
      id={f.id}
      filename={f.filename}
      filesize={f.filesize}
      uploadTime={f.uploadTime}
      expireTime={f.expireTime}
    />
  ));

  return <tbody>{rows}</tbody>;
}

export default FileRows;
