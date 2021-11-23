import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './index.css';
import Baton from './Baton';
import Login from './Login';

const App = () => {
  // This effectively means that we are storing our session tokens in memory.
  // Unfortunately, this means that if the user refreshes, navigates away, etc,
  // they'll have to re-login. This usually sucks, but since we aren't planning
  // on making this some kind of 'real' service for others to use, we're
  // actually OK with doing this as it trades convenience for extra security.
  const [token, setToken] = React.useState<string>();

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div className="wrapper">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Baton />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
