import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Simulator from './pages/Simulator';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import { useState } from 'react';

function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#F7FAFC] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F7FAFC] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isOnboarded ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />} />
        
        <Route path="/onboarding" element={<Onboarding onComplete={() => setIsOnboarded(true)} />} />
        
        <Route path="/dashboard" element={
          <AppLayout><Dashboard /></AppLayout>
        } />
        
        <Route path="/transactions" element={
          <AppLayout><Transactions /></AppLayout>
        } />

        <Route path="/simulator" element={
          <AppLayout><Simulator /></AppLayout>
        } />

        <Route path="/alerts" element={
          <AppLayout><Alerts /></AppLayout>
        } />

        <Route path="/settings" element={
          <AppLayout><Settings /></AppLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
