import { useState, useEffect } from 'react';
import { getSupportItems, SupportItem as SupportItemData, SupportIcon } from '../lib/support';
import { onDBUpdate } from '../lib/db-client';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone, Mail, MessageCircle, Gift, Users, Link,
  Instagram, Send, X, Headphones,
} from 'lucide-react';

// Platform icon renderer
function IconFor({ icon, className = 'w-5 h-5' }: { icon: SupportIcon; className?: string }) {
  const cls = className;
  switch (icon) {
    case 'telegram': return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
      </svg>
    );
    case 'whatsapp': return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    );
    case 'instagram': return <Instagram className={cls} />;
    case 'phone':     return <Phone className={cls} />;
    case 'email':     return <Mail className={cls} />;
    case 'message':   return <MessageCircle className={cls} />;
    case 'gift':      return <Gift className={cls} />;
    case 'group':     return <Users className={cls} />;
    case 'youtube':   return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
    case 'twitter':   return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
    default: return <Link className={cls} />;
  }
}

const ICON_COLORS: Record<SupportIcon, string> = {
  telegram:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  whatsapp:  'bg-green-500/20 text-green-400 border-green-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  phone:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  email:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  message:   'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  gift:      'bg-red-500/20 text-red-400 border-red-500/30',
  group:     'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  youtube:   'bg-red-600/20 text-red-400 border-red-500/30',
  twitter:   'bg-sky-500/20 text-sky-400 border-sky-500/30',
  link:      'bg-white/10 text-white/50 border-white/10',
};

interface SupportPanelProps {
  onClose: () => void;
}

function SupportItemRow({ item }: { item: SupportItemData }) {
  return (
    <a
      href={item.value}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 group"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${ICON_COLORS[item.icon]}`}>
        <IconFor icon={item.icon} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-white leading-tight">{item.label}</p>
        {item.hint && <p className="text-xs text-white/40 truncate mt-0.5">{item.hint}</p>}
      </div>
      <Send className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 rotate-45 shrink-0 transition-colors" />
    </a>
  );
}

export function SupportPanel({ onClose }: SupportPanelProps) {
  const [items, setItems] = useState<SupportItemData[]>([]);

  async function load() {
    const all = await getSupportItems();
    setItems(all.filter((i) => i.enabled).sort((a, b) => a.order - b.order));
  }

  useEffect(() => {
    load();
    return onDBUpdate('support_items', load);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative w-full sm:max-w-sm bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-pink-900/20">
          <div className="flex items-center gap-2.5">
            <Headphones className="w-5 h-5 text-purple-400" />
            <div>
              <p className="font-bold text-white text-sm">Support & Contact</p>
              <p className="text-xs text-white/40">We're here to help</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No support contacts configured.</p>
          ) : (
            items.map((item) => <SupportItemRow key={item.id} item={item} />)
          )}
        </div>

        <p className="text-center text-white/20 text-xs pb-4">SwaritSensei · Local-first · Private</p>
      </motion.div>
    </div>
  );
}

// Compact trigger button to embed anywhere
export function SupportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
    >
      <Headphones className="w-4 h-4 text-purple-400" />
      Support & Contact
    </button>
  );
}

export { IconFor, ICON_COLORS };
