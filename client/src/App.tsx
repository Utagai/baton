import { Component } from 'react';
// import logo from './logo.svg';
import './index.css';
import './App.css';

class App extends Component {
  state = {
    data: [],
  };

  componentDidMount() {
    this.callBackendAPI()
      .then((res) => this.setState({ data: res.express }))
      .catch((err) => console.log(err));
  }

  // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async () => {
    const response = await fetch('/express_backend');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  render() {
    const { data } = this.state;
    console.log('HELLO WORLD!');
    type file = {
      filename: string;
      filesize: string;
      uploadTime: string;
      expireTime: string;
    };
    const tableRows = data.map((f: file) => (
      <tr className="border-b hover:shadow-md">
        <th className="font-normal p-1 text-left px-10">
          <div className="font-bold font-mono">{f.filename}</div>
          <div className="text-xs italic">({f.filesize})</div>
        </th>
        <th className="font-normal border-b text-left  px-10">
          <div className="italic">{f.uploadTime}</div>
        </th>
        <th className="font-normal border-b text-left px-10">
          <div className="italic">{f.expireTime}</div>
        </th>
        <th className="font-normal border-b">
          <button
            aria-label="Download"
            type="button"
            className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-gray-500 hover:text-blue-100"
          >
            Download
          </button>
          <button
            aria-label="Download"
            type="button"
            className="bg-transparent font-semibold border rounded-sm p-1.5 hover:bg-red-500 hover:text-blue-100"
          >
            Delete
          </button>
        </th>
      </tr>
    ));
    return (
      <div className="grid place-items-center">
        <div className="text-6xl font-extrabold mx-10 my-5 text-gray-800">
          <h1 className="inline-block italic font-extralight">baton</h1>
          <span className="">🪄</span>
        </div>
        <div className="w-1/2 border-4 border-gray-200 rounded-sm mx-10">
          <table className="min-w-full mx-auto rounded-md bg-gray-50 text-gray-700">
            <thead className="">
              <tr className="border-2 border-b-gray-500">
                <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
                  File
                </th>
                <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
                  Uploaded At
                </th>
                <th className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2">
                  Expires In
                </th>
                <th
                  aria-label="Empty column for formatting"
                  className="bg-gray-200 text-gray-500 text-xs text-left px-10 uppercase tracking-wider py-2"
                />
              </tr>
            </thead>

            <tbody className="">{tableRows}</tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
