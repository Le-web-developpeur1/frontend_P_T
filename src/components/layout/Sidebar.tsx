import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiTruck, FiShoppingCart,
  FiFileText, FiDollarSign, FiBarChart2, FiSettings,
  FiUserPlus, FiAlertOctagon, FiCreditCard, FiMonitor, FiBriefcase, 
  FiX, FiPieChart, FiDatabase
} from 'react-icons/fi';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../context/AuthContext';

const allLinks = [
  { to: '/',          icon: FiGrid,         label: 'Dashboard',     roles: ['admin', 'gestionnaire']             },
  { to: '/capital',   icon: FiPieChart,     label: 'Capital',       roles: ['admin', 'gestionnaire']             },
  { to: '/caisse',    icon: FiMonitor,      label: 'Caisse',        roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/bank', icon: FiDatabase,          label: 'Banque',        roles: ['admin', 'gestionnaire']             },
  { to: '/sales',     icon: FiShoppingCart, label: 'Ventes',        roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/products',  icon: FiPackage,      label: 'Produits',      roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/clients',   icon: FiUsers,        label: 'Clients',       roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/credits',   icon: FiCreditCard,   label: 'Crédits',       roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/suppliers', icon: FiTruck,        label: 'Fournisseurs',  roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/invoices',  icon: FiFileText,     label: 'Factures',      roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/expenses',  icon: FiDollarSign,   label: 'Dépenses',      roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/damages',   icon: FiAlertOctagon, label: 'Avaries',       roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/employees', icon: FiBriefcase,    label: 'Employés',      roles: ['admin', 'gestionnaire']             },
  { to: '/reports',   icon: FiBarChart2,    label: 'Rapports',      roles: ['admin', 'gestionnaire', 'caissier'] },
  { to: '/users',     icon: FiUserPlus,     label: 'Utilisateurs',  roles: ['admin']                             },
  { to: '/settings',  icon: FiSettings,     label: 'Paramètres',    roles: ['admin', 'gestionnaire', 'caissier'] },
];

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isOpen, isMobile, onCloseMobile }: SidebarProps) {
  const { config } = useSystem();
  const { user }    = useAuth();

  const links = allLinks.filter(link => user?.role && link.roles.includes(user.role));

  const sidebarWidth = isMobile ? '280px' : (isOpen ? '220px' : '64px');
  const sidebarTransform = isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)';

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 39, transition: 'opacity 0.3s ease'
          }}
        />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40,
        width: sidebarWidth,
        background: 'linear-gradient(180deg, #1A2B5F 0%, #0f1a3a 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease, transform 0.3s ease',
        transform: sidebarTransform,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: '68px', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
            {config?.logo ? (
              <img src={config.logo} alt="logo"
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
            {(isOpen || isMobile) && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {config?.establishmentName || 'S.A.D POISSON'}
                </p>
                <p style={{ color: '#D4A017', fontSize: '10px', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {config?.establishmentSubtitle || 'ENTREPRISE SAADE'}
                </p>
              </div>
            )}
          </div>

          {isMobile && (
            <button onClick={onCloseMobile} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              padding: '6px', color: '#fff', cursor: 'pointer', flexShrink: 0
            }}>
              <FiX size={18} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              onClick={() => { if (isMobile) onCloseMobile(); }}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: '10px', padding: '11px 10px',
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
                  {(isOpen || isMobile) && (
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

        {(isOpen || isMobile) && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>Version 1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
}