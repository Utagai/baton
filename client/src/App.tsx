import './index.css';
import Banner from './Banner';
import Table from './Table';
import UploadButtons from './UploadButtons';

const App = () => (
  <div className="grid place-items-center">
    <Banner />

    <Table />

    <UploadButtons />
  </div>
);

export default App;
