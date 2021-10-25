// This is unfortunately duplicated in both the client and server code. Probably
// the right thing to do is to export these types out to a module and use that
// module as a dep in both client/server but since this project is quite small
// and this file is even smaller, I'm going to prefer simplicity.
// TODO: Probably would be good to rename this to avoid conflicts with
// variables named 'file'.
type file = {
  id: string;
  filename: string;
  filesize: number;
  uploadTime: string;
  expireTime: string;
};

export default file;
