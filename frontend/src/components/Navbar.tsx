import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav style={{ padding: '1rem', backgroundColor: '#f8f8f8' }}>
    <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
    <Link to="/register">Register</Link>
  </nav>
);

export default Navbar;