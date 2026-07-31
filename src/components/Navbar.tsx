import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Portfolio', path: '/' },
    { name: 'Practicals', path: '/practicals' },
  ];

  return (
    <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="text-lg sm:text-xl font-mono font-bold tracking-tighter shrink-0 select-none flex items-center">
          <Link to="/" className="text-white hover:text-white/90 transition-colors">Aakanksha</Link>
          <Link to="/admin" className="text-primary hover:text-primary-300 transition-colors">.dev</Link>
        </div>
        
        <nav className="flex gap-3 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="relative text-xs sm:text-sm font-mono transition-colors hover:text-white py-1"
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
