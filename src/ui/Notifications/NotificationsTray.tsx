import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationsTray() {
  const notifications = useGameStore((s) => s.notifications);
  const markAllRead = useGameStore((s) => s.markAllNotificationsRead);
  const dismiss = useGameStore((s) => s.dismissNotification);
  const markRead = useGameStore((s) => s.markNotificationRead);
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(-30).reverse();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <button
        onClick={() => { setOpen(true); markAllRead(); }}
        className="absolute bottom-4 right-4 z-30 panel-tight p-3 flex items-center gap-2 hover:bg-white/5 transition-colors"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="chip bg-accent-rose/20 text-accent-rose text-[10px]">{unread}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-bg-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-96 max-w-[90%] panel border-l border-white/10 bg-bg-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="font-semibold">Notifications</div>
                <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>Close ✕</button>
              </div>
              <div className="flex-1 overflow-y-auto scroll-thin p-2">
                {recent.length === 0 ? (
                  <div className="text-slate-500 text-sm p-8 text-center">No notifications yet.</div>
                ) : (
                  recent.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`p-3 rounded-lg mb-1 cursor-pointer border ${
                        n.type === 'good' ? 'bg-accent-emerald/5 border-accent-emerald/20' :
                        n.type === 'bad' ? 'bg-accent-rose/5 border-accent-rose/20' :
                        n.type === 'milestone' ? 'bg-accent-violet/5 border-accent-violet/20' :
                        'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-sm font-medium">{n.title}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="text-slate-500 hover:text-slate-300 text-xs"
                        >✕</button>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{n.body}</div>
                      <div className="text-[10px] text-slate-600 mt-1">Day {n.day}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
