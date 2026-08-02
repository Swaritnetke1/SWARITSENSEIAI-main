import { readDB, writeDB } from './db-client'

export type Role = 'user' | 'admin'

export interface AuthUser {
  username: string
  role: Role
}

interface StoredUser {
  username: string
  password: string
  role: Role
}

const SESSION_KEY = 'ss_session'
const ADMIN = { id: 'Swarit3236', password: 'swaritnetke..' }

export async function getStoredUsers(): Promise<StoredUser[]> {
  try { return await readDB<StoredUser[]>('users') } catch { return [] }
}

export async function saveStoredUsers(users: StoredUser[]): Promise<void> {
  await writeDB('users', users)
}

export async function addUser(username: string, password: string): Promise<boolean> {
  const users = await getStoredUsers()
  if (users.find((u) => u.username === username)) return false
  users.push({ username, password, role: 'user' })
  await saveStoredUsers(users)
  return true
}

export async function removeUser(username: string): Promise<void> {
  const users = await getStoredUsers()
  await saveStoredUsers(users.filter((u) => u.username !== username))
}

export async function loginUser(username: string, password: string): Promise<AuthUser | null> {
  const users = await getStoredUsers()
  const match = users.find((u) => u.username === username && u.password === password)
  if (!match) return null
  const session: AuthUser = { username: match.username, role: match.role }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function loginAdmin(id: string, password: string): Promise<AuthUser | null> {
  if (id !== ADMIN.id || password !== ADMIN.password) return null
  const session: AuthUser = { username: id, role: 'admin' }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export interface LoginAttempt {
  id: string
  timestamp: string
  username: string
  loginType: 'user' | 'admin'
  success: boolean
  userAgent?: string
}

export async function logLoginAttempt(attempt: Omit<LoginAttempt, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await readDB<LoginAttempt[]>('login_attempts').catch(() => [])
    const record: LoginAttempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...attempt,
    }
    await writeDB('login_attempts', [record, ...existing])
  } catch { /* non-critical */ }
}
