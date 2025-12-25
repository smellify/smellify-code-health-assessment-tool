import { useState, useEffect, useRef } from 'react';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SmellifyNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-full px-10 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{backgroundColor: '#5A33FF'}}>
            <img 
              src="/bug.png" 
              alt="Bug Icon" 
              className="w-7 h-7 object-contain"
            />
          </div>
          
          {/* Logo Text */}
          <span className="text-xl font-bold text-gray-900">Smellify</span>
        </div>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            {/* User Icon Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 shadow-md"
              style={{backgroundColor: '#5A33FF'}}
            >
              <User className="w-5 h-5 text-white" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleDashboardClick}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 text-sm font-medium">Dashboard</span>
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={handleLoginClick}
            className="text-white px-7 py-2.5 rounded-lg font-medium text-[15px] hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md" 
            style={{backgroundColor: '#5A33FF'}}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}