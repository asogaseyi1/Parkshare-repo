import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  backToDashboard?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ backToDashboard = false }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const buttonStyle = {
    marginRight: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '5px',
    cursor: 'pointer'
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <nav style={{ padding: '1rem', backgroundColor: '#002366', color: 'white' }}>
      {backToDashboard ? (
        <button onClick={() => navigate('/dashboard')} style={buttonStyle}>
          Back to Dashboard
        </button>
      ) : isLoggedIn ? (
        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      ) : (
        <>
          <button onClick={() => navigate('/login')} style={buttonStyle}>
            Login
          </button>
          <button onClick={() => navigate('/register')} style={{ ...buttonStyle, marginRight: 0 }}>
            Register
          </button>
        </>
      )}
    </nav>
  );
};

export default Navbar;
