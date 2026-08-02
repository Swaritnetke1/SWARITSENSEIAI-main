import { readDB, writeDB } from './db-client'

const BACKUP_FILE_NAME = 'swaritsensei_backup.json'

export interface DriveConfig {
  connected: boolean
  email: string
  fileId: string | null
  lastBackup: string | null
}

const DRIVE_DEFAULTS: DriveConfig = { connected: false, email: '', fileId: null, lastBackup: null }

export async function getDriveConfig(): Promise<DriveConfig> {
  try { return { ...DRIVE_DEFAULTS, ...await readDB<DriveConfig>('drive_config') } }
  catch { return { ...DRIVE_DEFAULTS } }
}

export async function saveDriveConfig(cfg: DriveConfig): Promise<void> {
  await writeDB('drive_config', cfg)
}

export async function disconnectDrive(): Promise<void> {
  await saveDriveConfig({ connected: false, email: '', fileId: null, lastBackup: null })
  try {
    const gapi = (window as any).gapi
    if (gapi?.auth2) gapi.auth2.getAuthInstance()?.signOut()
  } catch { /* ignore */ }
}

// --- GAPI bootstrap ---
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'

let gapiReady = false

async function loadGapi(): Promise<any> {
  if ((window as any).gapi && gapiReady) return (window as any).gapi
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      (window as any).gapi.load('client:auth2', async () => {
        try {
          await (window as any).gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          })
          gapiReady = true
          resolve((window as any).gapi)
        } catch (e) { reject(e) }
      })
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export async function connectDrive(): Promise<DriveConfig> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set')
  const gapi = await loadGapi()
  const authInstance = gapi.auth2.getAuthInstance()
  const user = await authInstance.signIn()
  const profile = user.getBasicProfile()
  const email = profile.getEmail()
  const cfg: DriveConfig = { connected: true, email, fileId: null, lastBackup: null }
  await saveDriveConfig(cfg)
  return cfg
}

async function getOrCreateFile(gapi: any, existing: string | null): Promise<string> {
  if (existing) {
    try {
      await gapi.client.drive.files.get({ fileId: existing, spaces: 'appDataFolder' })
      return existing
    } catch { /* file gone, create new */ }
  }
  const res = await gapi.client.drive.files.create({
    resource: { name: BACKUP_FILE_NAME, parents: ['appDataFolder'] },
    fields: 'id',
  })
  return res.result.id
}

export async function backupToDrive(data: object): Promise<void> {
  const cfg = await getDriveConfig()
  if (!cfg.connected) return
  try {
    const gapi = await loadGapi()
    const fileId = await getOrCreateFile(gapi, cfg.fileId)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
        'Content-Type': 'application/json',
      },
      body: blob,
    })
    await saveDriveConfig({ ...cfg, fileId, lastBackup: new Date().toISOString() })
  } catch (e) {
    console.error('Drive backup failed:', e)
    throw e
  }
}

export async function exportFromDrive(): Promise<object | null> {
  const cfg = await getDriveConfig()
  if (!cfg.connected || !cfg.fileId) return null
  try {
    const gapi = await loadGapi()
    const res = await gapi.client.drive.files.get({
      fileId: cfg.fileId,
      alt: 'media',
      spaces: 'appDataFolder',
    })
    return typeof res.result === 'string' ? JSON.parse(res.result) : res.result
  } catch (e) {
    console.error('Drive export failed:', e)
    return null
  }
}
