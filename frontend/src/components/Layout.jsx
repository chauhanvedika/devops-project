import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-brand">EIMS</div>
        <div className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/employees">Employees</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
        </div>
        <div className="nav-user">
          <span>{user?.username} {isAdmin && <em>(admin)</em>}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
