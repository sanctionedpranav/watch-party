/**
 * App - route table.
 *   /login, /register  -> public
 *   /, /room/:code     -> need login (ProtectedRoute)
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './shared/components/Navbar';
import ProtectedRoute from './shared/components/ProtectedRoute';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import HomePage from './modules/room/pages/HomePage';
import RoomPage from './modules/room/pages/RoomPage';

const App = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/room/:code" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;
