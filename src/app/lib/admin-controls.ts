import { readDB, writeDB } from './db-client'

export interface AdminControls {
  appName: string
  tagline: string
  motd: string
  motdEnabled: boolean
  allowSignup: boolean
}

const DEFAULTS: AdminControls = {
  appName: 'SwaritSensei',
  tagline: 'Data-Driven Productivity',
  motd: '',
  motdEnabled: true,
  allowSignup: true,
}

export async function getAdminControls(): Promise<AdminControls> {
  try {
    return { ...DEFAULTS, ...await readDB<AdminControls>('admin_controls') }
  } catch {
    return { ...DEFAULTS }
  }
}

export async function saveAdminControls(controls: AdminControls): Promise<void> {
  await writeDB('admin_controls', controls)
}

export async function patchAdminControls(patch: Partial<AdminControls>): Promise<void> {
  const current = await getAdminControls()
  await saveAdminControls({ ...current, ...patch })
}
