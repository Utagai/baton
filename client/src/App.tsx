import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './index.css';
import Baton from './Baton';

const App = () => (
  <div className="wrapper">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Baton />} />
      </Routes>
    </BrowserRouter>
  </div>
);

export default App;
