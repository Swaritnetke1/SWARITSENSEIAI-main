type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

export function onDBUpdate(collection: string, fn: Listener): () => void {
  if (!listeners.has(collection)) listeners.set(collection, new Set())
  listeners.get(collection)!.add(fn)
  return () => listeners.get(collection)?.delete(fn)
}

if (import.meta.hot) {
  import.meta.hot.on('db-update', ({ collection }: { collection: string }) => {
    listeners.get(collection)?.forEach((fn) => fn())
  })
}

export async function readDB<T>(collection: string): Promise<T> {
  const res = await fetch(`/api/db/${collection}`)
  if (!res.ok) throw new Error(`DB read failed: ${collection} (${res.status})`)
  return res.json() as Promise<T>
}

export async function writeDB(collection: string, data: unknown): Promise<void> {
  const res = await fetch(`/api/db/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  })
  if (!res.ok) throw new Error(`DB write failed: ${collection} (${res.status})`)
}
