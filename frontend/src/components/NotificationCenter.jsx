import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/client';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  useEffect(() => { getNotifications().then(setItems); }, []);
  const unread = items.filter((item) => !item.read).length;
  const read = async (id) => { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)); };
  const readAll = async () => { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, read: true }))); };
  return <div className="relative"><button onClick={() => setOpen((current) => !current)} aria-label="Notificaciones" className="relative p-1.5 text-ink-muted hover:text-ink"><Bell size={16} />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-alert text-void text-[9px] font-mono flex items-center justify-center">{unread}</span>}</button>{open && <div className="absolute right-0 top-8 z-20 w-80 bg-panel border border-line rounded-lg shadow-xl overflow-hidden"><div className="p-3 border-b border-line flex items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Centro de notificaciones</span>{unread > 0 && <button onClick={readAll} className="text-[10px] text-signal hover:underline">Marcar todas</button>}</div>{items.length ? items.slice(0, 6).map((item) => <button key={item.id} onClick={() => read(item.id)} className={`w-full text-left p-3 border-b border-line/60 hover:bg-raised ${item.read ? 'opacity-60' : ''}`}><div className="flex items-start gap-2"><div className="flex-1"><div className="text-xs text-ink">{item.title}</div><div className="text-[11px] text-ink-muted mt-1">{item.message}</div></div>{!item.read && <Check size={13} className="text-signal" />}</div></button>) : <div className="p-5 text-center text-xs text-ink-muted">No hay notificaciones.</div>}</div>}</div>;
}
