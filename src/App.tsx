import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components';
import { MainTimer, Settings, TimeSettingPage } from './pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<TimeSettingPage />} />
          <Route path="timer" element={<MainTimer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
