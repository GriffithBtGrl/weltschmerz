import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';
import { Menu, X } from 'lucide-react';
import Badge from '../ui/Badge';

const BOARDS = ['tech', 'art', 'random', 'feels', 'anime', 'gaming', 'music', 'memes'];

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-mono font-bold text-base md:text-lg text-neon-blue hover:text-neon-blue/80 transition-colors">
          <span className="text-gray-500">&gt;</span> weltschmerz
          <span className="animate-pulse text-neon-magenta">_</span>
        </Link>

        {/* Boards desktop */}
        <div className="hidden md:flex items-center gap-4 font-mono text-xs text-gray-500">
          {BOARDS.map((board) => (
            <Link
              key={board}
              to={`/?board=${board}`}
              className="hover:text-neon-blue transition-colors"
            >
              /{board}/
            </Link>
          ))}
        </div>

        {/* Auth + hamburguesa */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Badge variant="magenta">admin</Badge>
                </Link>
              )}
              <Link to={`/user/${user.username}`} className="font-mono text-xs text-gray-400 hidden sm:block hover:text-neon-blue transition-colors">
                {user.username}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">entrar</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">registrarse</Button>
              </Link>
            </>
          )}

          {/* Hamburguesa solo mobile */}
          <button
            className="md:hidden text-gray-400 hover:text-neon-blue transition-colors ml-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-dark-700 bg-dark-900 px-4 py-3 flex flex-col gap-3">
          <p className="font-mono text-xs text-gray-600 uppercase tracking-wider">boards</p>
          {BOARDS.map((board) => (
            <Link
              key={board}
              to={`/?board=${board}`}
              onClick={() => setMenuOpen(false)}
              className="font-mono text-sm text-gray-400 hover:text-neon-blue transition-colors"
            >
              /{board}/
            </Link>
          ))}
          <div className="border-t border-dark-700 pt-3">
            <Link to="/create" onClick={() => setMenuOpen(false)}>
              <Button variant="magenta" size="sm" className="w-full">
                + nuevo post
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;