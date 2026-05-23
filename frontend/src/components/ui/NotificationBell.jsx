import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, fetchUnreadCount, fetchNotifications, readAll, readOne } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    // Polling cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const handleReadAll = () => {
    readAll();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative text-gray-400 hover:text-neon-blue transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-neon-magenta text-white font-mono text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
            <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="font-mono text-xs text-gray-600 hover:text-neon-blue transition-colors"
              >
                marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="font-mono text-xs text-gray-600 text-center py-6">sin notificaciones</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={`/post/${n.post_id}`}
                  onClick={() => { readOne(n.id); setOpen(false); }}
                  className={`block px-4 py-3 border-b border-dark-700 hover:bg-dark-700 transition-colors ${!n.read ? 'bg-dark-700/50' : ''
                    }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-gray-300">
                        {n.type === 'comment_on_post' ? (
                          <>
                            <span className="text-neon-blue">
                              {n.from_username || n.from_anonymous_id?.substring(0, 10) || 'alguien'}
                            </span>
                            {' comentó en '}
                            <span className="text-gray-200">{n.post_title}</span>
                          </>
                        ) : n.type === 'reply_to_comment' ? (
                          <>
                            <span className="text-neon-blue">
                              {n.from_username || n.from_anonymous_id?.substring(0, 10) || 'alguien'}
                            </span>
                            {' respondió tu comentario en '}
                            <span className="text-gray-200">{n.post_title}</span>
                          </>
                        ) : n.type === 'mention' ? (
                          <>
                            <span className="text-neon-blue">
                              {n.from_username || n.from_anonymous_id?.substring(0, 10) || 'alguien'}
                            </span>
                            {' te mencionó en '}
                            <span className="text-gray-200">{n.post_title}</span>
                          </>
                        ) : null}
                      </p>
                      {n.comment_content && (
                        <p className="font-mono text-xs text-gray-600 mt-0.5 truncate">
                          {n.comment_content}
                        </p>
                      )}
                      <p className="font-mono text-xs text-gray-700 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;