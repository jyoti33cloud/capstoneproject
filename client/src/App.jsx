import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SelectRole from './pages/SelectRole';
import DashboardRouter from './pages/DashboardRouter';
import Learn from './pages/Learn';
import Community from './pages/Community';
import FindHelp from './pages/FindHelp';
import BookAppointment from './pages/BookAppointment';
import DailyRoutine from './pages/DailyRoutine';
import AACTool from './pages/AACTool';
import Profile from './pages/Profile';
import DisabilityChecklist from './pages/DisabilityChecklist';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/home" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
      <Route path="/disability-checklist" element={<ProtectedRoute><DisabilityChecklist /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/find-help" element={<ProtectedRoute><FindHelp /></ProtectedRoute>} />
      <Route path="/book" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
      <Route path="/book/:specialistId" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
      <Route path="/routine" element={<ProtectedRoute><DailyRoutine /></ProtectedRoute>} />
      <Route path="/aac" element={<ProtectedRoute><AACTool /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
