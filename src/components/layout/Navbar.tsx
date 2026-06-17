import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiBell, FiLogOut, FiCheck, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/notificationApi';
import useAutoRefresh from '../../hooks/useAutoRefresh';


interface NavbarProps {
  onToggle: () => void;
  isOpen: boolean;
  isMobile: boolean;
}

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  lowStock:      '📦',
  newSale:       '🛒',
  clientBlocked: '🔒',
};

export default function Navbar({ onToggle, isOpen, isMobile  }: NavbarProps) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount]     = useState<number>(0);
  const [dropdownOpen, setDropdownOpen]   = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  useEffect(() => { fetchNotifications(); }, []);
  useAutoRefresh(fetchNotifications, 15000);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
      toast.success('Toutes les notifications marquées comme lues');
    } catch {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch {}
  };

  const handleNotifClick = (notif: NotificationItem) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      setDropdownOpen(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleLogout = () => {
    logoutUser();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrateur',
    gestionnaire: 'Gestionnaire',
    caissier: 'Caissier',
  };

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0, zIndex: 30,
      left: isMobile ? 0 : (isOpen ? '220px' : '64px'),
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      height: '64px', transition: 'left 0.3s ease',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 20px' }}>

        <button onClick={onToggle} style={{
          padding: '8px', borderRadius: '8px', border: 'none',
          background: 'transparent', cursor: 'pointer', color: '#6b7280',
          display: 'flex', alignItems: 'center'
        }}>
          <FiMenu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
              padding: '8px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer', position: 'relative',
              color: '#6b7280', display: 'flex', alignItems: 'center'
            }}>
              <FiBell size={19} className={unreadCount > 0 ? 'animate-pulse' : ''} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  minWidth: '16px', height: '16px', borderRadius: '50%',
                  background: '#D4A017', border: '1.5px solid #fff',
                  fontSize: '9px', fontWeight: 700, color: '#1A2B5F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '48px', right: 0,
                width: '360px', maxHeight: '480px',
                background: '#fff', borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                border: '1px solid #f0f0f0',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', zIndex: 100
              }}>
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#1A2B5F', margin: 0 }}>
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </p>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{
                      fontSize: '11px', color: '#1A2B5F', fontWeight: 600,
                      background: 'none', border: 'none', cursor: 'pointer'
                    }}>
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                          background: notif.isRead ? '#fff' : '#EBF5FB',
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = notif.isRead ? '#f9fafb' : '#dceaf7'}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? '#fff' : '#EBF5FB'}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>
                          {typeIcons[notif.type] || '🔔'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <p style={{
                              fontSize: '13px', fontWeight: notif.isRead ? 500 : 700,
                              color: '#1A2B5F', margin: 0
                            }}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4A017', flexShrink: 0 }} />
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 4px', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                          {!notif.isRead && (
                            <button onClick={(e) => { e.stopPropagation(); handleMarkRead(notif._id); }}
                              title="Marquer comme lu"
                              style={{ padding: '3px', borderRadius: '6px', border: 'none', background: '#f0f9ff', color: '#0284c7', cursor: 'pointer' }}>
                              <FiCheck size={12} />
                            </button>
                          )}
                          <button onClick={(e) => handleDelete(notif._id, e)}
                            title="Supprimer"
                            style={{ padding: '3px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A2B5F', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{roleLabel[user?.role || ''] || user?.role}</p>
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
            }}>
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}