import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuizPlayer from './pages/QuizPlayer';
import Result from './pages/Result';
import StaffBoard from './pages/StaffBoard';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import StaffReport from './pages/StaffReport';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen text-slate-100">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              <Route path="/quiz/:code" element={
                <ProtectedRoute><QuizPlayer /></ProtectedRoute>
              } />

              <Route path="/result/:id" element={
                <ProtectedRoute><Result /></ProtectedRoute>
              } />

              <Route path="/leaderboard/:quizId" element={<Leaderboard />} />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
              } />

              <Route path="/staff" element={
                <ProtectedRoute roles={['staff', 'admin']}><StaffBoard /></ProtectedRoute>
              } />
              <Route path="/staff/report/:id" element={
                <ProtectedRoute roles={['staff', 'admin']}><StaffReport /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
