function handleDelete(id: string, deleteFile: (innerId: string) => void) {
  fetch(`/delete/${id}`, {
    method: 'DELETE',
  })
    .then(async (resp) => {
      console.log('response from backend: ', await resp.text());
      deleteFile(id);
    })
    .catch((err) => {
      throw Error(`error from /delete call: ${err}`);
    });
}

function DeleteButton(props: { id: string; deleteFile: (id: string) => void }) {
  const { id, deleteFile } = props;

  return (
    <button
      aria-label="Delete"
      type="button"
      onClick={() => handleDelete(id, deleteFile)}
      className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-red-500 hover:text-blue-100"
    >
      🗑️ Delete
    </button>
  );
}

export default DeleteButton;
