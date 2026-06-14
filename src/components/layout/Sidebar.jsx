import { NavLink } from 'react-router-dom';
import { FiGrid, FiPackage, FiUsers, FiTruck,
  FiShoppingCart, FiFileText, FiDollarSign,
  FiBarChart2, FiSettings, FiUserPlus, FiAlertOctagon, FiCreditCard, FiMonitor } from 'react-icons/fi';
import { useSystem } from '../../context/SystemContext';

const links = [
  { to: '/',          icon: FiGrid,         label: 'Dashboard'     },
  { to: '/caisse', icon: FiMonitor, label: 'Caisse' },
  { to: '/sales',     icon: FiShoppingCart, label: 'Ventes'        },
  { to: '/products',  icon: FiPackage,      label: 'Produits'      },
  { to: '/clients',   icon: FiUsers,        label: 'Clients'       },
  { to: '/credits', icon: FiCreditCard, label: 'Crédits' },
  { to: '/suppliers', icon: FiTruck,        label: 'Fournisseurs'  },
  { to: '/invoices',  icon: FiFileText,     label: 'Factures'      },
  { to: '/expenses',  icon: FiDollarSign,   label: 'Dépenses'      },
  { to: '/reports',   icon: FiBarChart2,    label: 'Rapports'      },
  { to: '/users',     icon: FiUserPlus,     label: 'Utilisateurs'  },
  { to: '/damages', icon: FiAlertOctagon, label: 'Avaries' },
  { to: '/settings',  icon: FiSettings,     label: 'Paramètres'    },
];

export default function Sidebar({ isOpen }) {
  const { config } = useSystem();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40,
      width: isOpen ? '220px' : '64px',
      background: 'linear-gradient(180deg, #1A2B5F 0%, #0f1a3a 100%)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s ease',
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: '68px'
      }}>
        {config?.logo ? (
          <img src={`http://localhost:4000/${config.logo}`} alt="logo"
            style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(212,160,23,0.2)', border: '1px solid rgba(212,160,23,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#D4A017' }}>S</span>
          </div>
        )}
        {isOpen && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {config?.establishmentName || 'S.A.D POISSON'}
            </p>
            <p style={{ color: '#D4A017', fontSize: '10px', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {config?.establishmentSubtitle || 'ENTREPRISE SAADE'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {links.map(({ to, icon: Icon, label }) => (
  <NavLink
    key={to} to={to} end={to === '/'}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center',
      gap: '10px', padding: '9px 10px',
      borderRadius: '10px', marginBottom: '2px',
      textDecoration: 'none', transition: 'all 0.2s',
      background: isActive ? '#D4A017' : 'transparent',
      color: isActive ? '#1A2B5F' : 'rgba(255,255,255,0.65)',
    })}
  >
    {({ isActive }) => (
      <>
        <Icon size={18} style={{
          flexShrink: 0,
          color: isActive ? '#1A2B5F' : 'rgba(255,255,255,0.65)'
        }} />
        {isOpen && (
          <span style={{
            fontSize: '13px',
            fontWeight: isActive ? 700 : 500,
            whiteSpace: 'nowrap',
            color: isActive ? '#1A2B5F' : 'rgba(255,255,255,0.65)'
          }}>
            {label}
          </span>
        )}
      </>
    )}
  </NavLink>
        ))}
      </nav>

      {/* Version */}
      {isOpen && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>Version 1.0.0</p>
        </div>
      )}
    </aside>
  );
}