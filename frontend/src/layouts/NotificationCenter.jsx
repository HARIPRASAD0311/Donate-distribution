import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, Info, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
  } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const severityIcon = {
    critical: <AlertCircle className="w-4 h-4 text-status-critical shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-status-warning shrink-0" />,
    success: <Check className="w-4 h-4 text-status-success shrink-0" />,
    info: <Info className="w-4 h-4 text-teal shrink-0" />,
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-brand-surface-hover border border-brand-border/60 transition-colors"
        title="Notification Centre"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-status-critical text-white text-[10px] font-bold font-mono flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-brand-border rounded-xl shadow-dropdown z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">Operational Notifications</span>
              {unreadCount > 0 && (
                <StatusBadge variant="critical" size="xs">
                  {unreadCount} NEW
                </StatusBadge>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-[11px] text-text-secondary hover:text-status-critical flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-brand-border-light">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                No active operational notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-brand-surface-hover cursor-pointer transition-colors ${
                    !notif.read ? 'bg-teal-subtle/40' : ''
                  }`}
                >
                  {severityIcon[notif.severity] || severityIcon.info}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
