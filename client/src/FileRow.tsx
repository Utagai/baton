import { format, formatDuration, intervalToDuration } from 'date-fns';
import prettyBytes from 'pretty-bytes';

import Button from './Button';
import './index.css';
import FileMetadata from './FileMetadata';
import { error, loading, success } from './Notify';

// This function won't be something we can test in jest, we'd need true E2E
// testing for it.
/* istanbul ignore next */
function triggerDownload(id: string, filename: string) {
  // This is so hacky but this seems to be the nicest way to do it...
  // window.open() seems nicer but it can trigger pop-up blockers and such (and
  // at least for my own firefox set-up, firefox initially blocks it...). This
  // gives a more seamless experience.
  // TODO: On top of this already hacky business, we are hardcoding the
  // host/port of the backend.
  const url = `http://192.168.1.106:8080/download/${id}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  loading('triggering download', { filename });
}

function deleteFileOnBackend(
  fileId: string,
  deleteMetadataFromState: (innerFileId: string) => void,
) {
  fetch(`/delete/${fileId}`, {
    method: 'DELETE',
  })
    .then(async () => {
      deleteMetadataFromState(fileId);
      success('deleted file');
    })
    .catch((err) => {
      error('error from /delete call', err);
    });
}

function nameAndSizeElem(name: string, size: number) {
  return (
    <td className="font-normal p-1 text-left px-10">
      <div className="font-bold font-mono">{name}</div>
      <div className="text-xs italic">({prettyBytes(size)})</div>
    </td>
  );
}

function uploadTimeElem(uploadTime: string) {
  const uploadTimeHumanReadable = format(Date.parse(uploadTime), 'MMMM do, p');
  return (
    <td className="font-normal border-b text-left  px-10">
      <div className="italic">{uploadTimeHumanReadable}</div>
    </td>
  );
}

function expireTimeLeftElem(expireTime: string) {
  // TODO: Handle negative values here?
  const timeLeftStr = formatDuration(
    intervalToDuration({
      start: new Date(),
      end: Date.parse(expireTime),
    }),
    { format: ['days', 'hours', 'minutes'], delimiter: ', ' },
  );
  return (
    <td className="font-normal border-b text-left px-10">
      <div className="italic">{timeLeftStr}</div>
    </td>
  );
}

function fileRowButtonsElem(
  fileId: string,
  name: string,
  deleteFileFromState: (innerFileId: string) => void,
) {
  return (
    <td className="font-normal border-b">
      <Button
        ariaLabel="Download"
        onClick={() => {
          // This function won't be something we can test in jest, we'd need true E2E
          // testing for it.
          /* istanbul ignore next */
          triggerDownload(fileId, name);
        }}
      >
        💾 Download
      </Button>
      <Button
        ariaLabel="Delete"
        onClick={() => {
          deleteFileOnBackend(fileId, deleteFileFromState);
        }}
      >
        🗑️ Delete
      </Button>
    </td>
  );
}

function FileRow(props: {
  metadata: FileMetadata;
  deleteMetadataFromState: (fileId: string) => void;
}) {
  const {
    metadata: { id, name, size, uploadTime, expireTime },
    deleteMetadataFromState,
  } = props;

  return (
    <tr className="border-b hover:shadow-md" key={id}>
      {nameAndSizeElem(name, size)}
      {uploadTimeElem(uploadTime)}
      {expireTimeLeftElem(expireTime)}
      {fileRowButtonsElem(id, name, deleteMetadataFromState)}
    </tr>
  );
}

export default FileRow;
