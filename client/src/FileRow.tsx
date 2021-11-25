import { format, formatDuration, intervalToDuration } from 'date-fns';
import prettyBytes from 'pretty-bytes';

import { BackendClient } from './BackendClient';
import BackendError from './BackendError';
import Button from './Button';
import './index.css';
import FileMetadata from './FileMetadata';
import { error, loading, success } from './Notify';

// This function won't be something we can test in jest, we'd need true E2E
// testing for it.
/* istanbul ignore next */
function triggerDownload(id: string, filename: string) {
  loading('triggering download', { filename });
  // This is so hacky but this seems to be the nicest way to do it...
  // window.open() seems nicer but it can trigger pop-up blockers and such (and
  // at least for my own firefox set-up, firefox initially blocks it...). This
  // gives a more seamless experience.
  // TODO: On top of this already hacky business, we are hardcoding the
  // host/port of the backend.
  const url = `http://localhost:8080/download/${id}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// TODO: All this argument passing makes me wonder if a class based component is
// better here? Maybe some research on pros/cons.
function deleteFileOnBackend(
  fileId: string,
  backendClient: BackendClient,
  deleteMetadataFromState: (fileId: string) => void,
) {
  // TODO: This is duplicated in upload as well.
  backendClient
    .delete(fileId)
    .then((resp) => {
      deleteMetadataFromState(resp.json.id);
      return success('deleted file');
    })
    .catch((err: BackendError) => {
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
  backendClient: BackendClient,
  deleteFileFromState: (fileId: string) => void,
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
          deleteFileOnBackend(fileId, backendClient, deleteFileFromState);
        }}
      >
        🗑️ Delete
      </Button>
    </td>
  );
}

function FileRow(props: {
  backendClient: BackendClient;
  metadata: FileMetadata;
  deleteMetadataFromState: (fileId: string) => void;
}) {
  const {
    backendClient,
    metadata: { id, name, size, uploadTime, expireTime },
    deleteMetadataFromState,
  } = props;

  return (
    <tr className="border-b hover:shadow-md" key={id}>
      {nameAndSizeElem(name, size)}
      {uploadTimeElem(uploadTime)}
      {expireTimeLeftElem(expireTime)}
      {fileRowButtonsElem(id, name, backendClient, deleteMetadataFromState)}
    </tr>
  );
}

export default FileRow;
