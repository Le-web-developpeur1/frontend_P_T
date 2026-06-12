import { FiMenu, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar({ onToggle, isOpen }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const roleLabel = {
    admin: 'Administrateur',
    gestionnaire: 'Gestionnaire',
    caissier: 'Caissier',
  };

  return (
    <header className={`fixed top-0 right-0 z-30 bg-white border-b border-gray-200 h-16
      transition-all duration-300 ${isOpen ? 'left-64' : 'left-16'}`}>
      <div className="flex items-center justify-between h-full px-4">

        {/* Toggle */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <FiMenu size={22} />
        </button>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative transition-colors">
            <FiBell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-blue-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabel[user?.role] || user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
              title="Déconnexion"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}