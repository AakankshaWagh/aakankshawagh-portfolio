import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Portfolio', path: '/' },
    { name: 'Practicals', path: '/practicals' },
    { name: 'Admin', path: '/admin' },
  ];

  return (
    <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-mono font-bold text-white tracking-tighter">
          Aakanksha<span className="text-primary">.dev</span>
        </Link>
        
        <nav className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="relative text-sm font-mono transition-colors hover:text-white"
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 right-0 h-0.5 bg-primary -bottom-1"
                />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
