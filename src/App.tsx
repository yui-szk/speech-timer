import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components';
import { MainTimer, Settings } from './pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<MainTimer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
