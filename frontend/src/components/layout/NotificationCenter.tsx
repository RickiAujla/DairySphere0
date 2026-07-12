import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, Check, ShieldAlert, BadgeCheck, CheckCheck } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'security' | 'system' | 'cooperative';
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Tenant Security Policy Audited',
      body: 'Verified schema isolation and table permissions with zero violations.',
      time: '12m ago',
      read: false,
      type: 'security',
    },
    {
      id: '2',
      title: 'Global RBAC Matrix Recalibrated',
      body: 'Cooperative roles matched successfully with physical workspace credentials.',
      time: '1h ago',
      read: false,
      type: 'cooperative',
    },
    {
      id: '3',
      title: 'Automatic Tenant Backup Complete',
      body: 'Regional data safely snapshot to durable cloud storage systems.',
      time: '4h ago',
      read: true,
      type: 'system',
    },
  ]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl relative transition"
        aria-label="Notification center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-650 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 slide-in-from-top-1">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
            <div>
              <span className="text-[10px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest block">Notifications</span>
              <span className="text-[9px] text-gray-400 font-medium block leading-none mt-0.5">
                {unreadCount} unread system events
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[9px] font-black text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="w-6 h-6 text-slate-300 dark:text-slate-750 mx-auto mb-1.5" />
                <span className="text-[10px] font-bold text-slate-400 block uppercase">All caught up</span>
              </div>
            ) : (
              notifications.map((notif) => {
                let ColorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
                let Icon = Info;

                if (notif.type === 'security') {
                  ColorClass = 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
                  Icon = ShieldAlert;
                } else if (notif.type === 'cooperative') {
                  ColorClass = 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400';
                  Icon = BadgeCheck;
                }

                return (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-xl transition flex gap-3 ${
                      notif.read
                        ? 'opacity-65 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center ${ColorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-[10px] font-bold text-gray-900 dark:text-slate-200 truncate">
                          {notif.title}
                        </h5>
                        <span className="text-[8px] text-gray-400 dark:text-slate-500 font-semibold font-mono shrink-0 whitespace-nowrap">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 leading-normal font-medium">
                        {notif.body}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleRead(notif.id)}
                      className={`shrink-0 p-1 rounded-lg self-center transition ${
                        notif.read
                          ? 'text-slate-300 dark:text-slate-700 hover:text-slate-500'
                          : 'text-teal-600 dark:text-teal-400 hover:text-teal-800'
                      }`}
                      title={notif.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
