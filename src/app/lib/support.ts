import { readDB, writeDB } from './db-client'

export type SupportIcon =
  | 'telegram' | 'whatsapp' | 'instagram' | 'phone' | 'email'
  | 'message' | 'gift' | 'group' | 'youtube' | 'twitter' | 'link'

export interface SupportItem {
  id: string
  icon: SupportIcon
  label: string
  value: string
  hint?: string
  enabled: boolean
  order: number
}

export const SUPPORT_DEFAULTS: SupportItem[] = [
  { id: 'tg_support', icon: 'telegram', label: 'Telegram Support',   value: 'https://t.me/',                    hint: 'Chat with us on Telegram',       enabled: true,  order: 0 },
  { id: 'tg_group',   icon: 'group',    label: 'Join Telegram Group', value: 'https://t.me/',                    hint: 'Community & updates',            enabled: true,  order: 1 },
  { id: 'wa',         icon: 'whatsapp', label: 'WhatsApp Support',    value: 'https://wa.me/',                   hint: 'Quick support on WhatsApp',      enabled: true,  order: 2 },
  { id: 'email',      icon: 'email',    label: 'Email Us',            value: 'mailto:support@swaritsensei.ai',   hint: 'support@swaritsensei.ai',        enabled: true,  order: 3 },
  { id: 'phone',      icon: 'phone',    label: 'Call Us',             value: 'tel:+91',                          hint: '+91 XXXXX XXXXX',                enabled: false, order: 4 },
  { id: 'gift',       icon: 'gift',     label: 'Gift the Developer',  value: 'https://t.me/',                    hint: 'Support dev on Telegram ❤️', enabled: true,  order: 5 },
  { id: 'ig',         icon: 'instagram',label: 'Instagram',           value: 'https://instagram.com/',           hint: '@swaritsensei',                  enabled: false, order: 6 },
]

export async function getSupportItems(): Promise<SupportItem[]> {
  try { return await readDB<SupportItem[]>('support_items') } catch { return SUPPORT_DEFAULTS }
}

export async function saveSupportItems(items: SupportItem[]): Promise<void> {
  await writeDB('support_items', items)
}

export async function resetSupportItems(): Promise<void> {
  await saveSupportItems(SUPPORT_DEFAULTS)
}
