import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiTruck,
  FiShoppingCart, FiFileText, FiDollarSign,
  FiBarChart2, FiSettings
} from 'react-icons/fi';
import { useSystem } from '../../context/SystemContext';

const links = [
  { to: '/',          icon: FiGrid,        label: 'Dashboard'    },
  { to: '/sales',     icon: FiShoppingCart, label: 'Caisse'      },
  { to: '/products',  icon: FiPackage,      label: 'Produits'    },
  { to: '/clients',   icon: FiUsers,        label: 'Clients'     },
  { to: '/suppliers', icon: FiTruck,        label: 'Fournisseurs'},
  { to: '/invoices',  icon: FiFileText,     label: 'Factures'    },
  { to: '/expenses',  icon: FiDollarSign,   label: 'Dépenses'    },
  { to: '/reports',   icon: FiBarChart2,    label: 'Rapports'    },
  { to: '/settings',  icon: FiSettings,     label: 'Paramètres'  },
];

export default function Sidebar({ isOpen }) {
  const { config } = useSystem();

  return (
    <aside className={`fixed top-0 left-0 h-full bg-blue-900 text-white z-40 transition-all duration-300
      ${isOpen ? 'w-64' : 'w-16'} flex flex-col`}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
        {config?.logo && (
          <img
            src={`http://localhost:4000/${config.logo}`}
            alt="logo"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        )}
        {isOpen && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight truncate">
              {config?.establishmentName || 'S.A.D POISSON'}
            </p>
            <p className="text-yellow-400 text-xs truncate">
              {config?.establishmentSubtitle || 'ENTREPRISE SAADE'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 mb-1
              ${isActive
                ? 'bg-yellow-500 text-blue-900 font-semibold'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {isOpen && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-blue-800">
          <p className="text-blue-400 text-xs">Version 1.0.0</p>
        </div>
      )}
    </aside>
  );
}