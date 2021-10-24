// This is unfortunately duplicated in both the client and server code. Probably
// the right thing to do is to export these types out to a module and use that
// module as a dep in both client/server but since this project is quite small
// and this file is even smaller, I'm going to prefer simplicity.
type uploadedFile = {
  filename: string;
  filesize: number;
  id: string;
  uploadTime: Date;
  expireTime: Date;
};

export default uploadedFile;
