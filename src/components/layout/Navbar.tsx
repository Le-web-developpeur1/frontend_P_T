import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi';
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
    <header style={{
      position: 'fixed', top: 0, right: 0, zIndex: 30,
      left: isOpen ? '220px' : '64px',
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      height: '60px', transition: 'left 0.3s ease',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 10px' }}>

        {/* Toggle */}
        <button onClick={onToggle} style={{
          padding: '8px', borderRadius: '8px', border: 'none',
          background: 'transparent', cursor: 'pointer', color: '#6b7280',
          display: 'flex', alignItems: 'center'
        }}>
          <FiMenu size={20} />
        </button>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Notification */}
          <button style={{
            padding: '8px', borderRadius: '8px', border: 'none',
            background: 'transparent', cursor: 'pointer', position: 'relative',
            color: '#6b7280', display: 'flex', alignItems: 'center'
          }}>
            <FiBell size={19} />
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#D4A017', border: '1.5px solid #fff'
            }} />
          </button>

          {/* Séparateur */}
          <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A2B5F', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{roleLabel[user?.role] || user?.role}</p>
            </div>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#1A2B5F', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#D4A017', fontWeight: 800, fontSize: '15px'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} style={{
              padding: '8px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer', color: '#9ca3af',
              display: 'flex', alignItems: 'center'
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}