import { sample } from './sampleData'

const KEY = 'auto-garage-crm'

function load() {
  const data = localStorage.getItem(KEY)
  if (data) return JSON.parse(data)
  // seed
  const seeded = sample
  localStorage.setItem(KEY, JSON.stringify(seeded))
  return seeded
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getDB() {
  return load()
}

export function setDB(next) {
  save(next)
}

export function resetDB() {
  localStorage.removeItem(KEY)
}

export function listClients() {
  return load().clients
}

export function getClient(id) {
  return load().clients.find(c => String(c.id) === String(id))
}

export function upsertClient(payload) {
  const db = load()
  if (payload.id) {
    db.clients = db.clients.map(c => c.id === payload.id ? payload : c)
  } else {
    const id = db.meta.clientSeq++
    db.clients.push({ ...payload, id })
  }
  save(db)
  return payload.id ? payload : { ...payload, id: db.meta.clientSeq - 1 }
}

export function deleteClient(id) {
  const db = load()
  db.clients = db.clients.filter(c => String(c.id) !== String(id))
  save(db)
}

export function listServices() {
  return load().services
}

export function getService(id) {
  return load().services.find(s => String(s.id) === String(id))
}

export function upsertService(payload) {
  const db = load()
  if (payload.id) {
    db.services = db.services.map(s => s.id === payload.id ? payload : s)
  } else {
    const id = db.meta.serviceSeq++
    db.services.push({ ...payload, id })
  }
  save(db)
  return payload.id ? payload : { ...payload, id: db.meta.serviceSeq - 1 }
}

export function deleteService(id) {
  const db = load()
  db.services = db.services.filter(s => String(s.id) !== String(id))
  save(db)
}

export function listBilling() {
  return load().billing
}

export function getInvoice(id) {
  return load().billing.find(b => String(b.id) === String(id))
}

export function upsertInvoice(payload) {
  const db = load()
  const exists = db.billing.find(b => String(b.id) === String(payload.id))
  if (exists) {
    db.billing = db.billing.map(b => String(b.id) === String(payload.id) ? payload : b)
  } else {
    db.billing.push(payload)
  }
  save(db)
  return payload
}

export function deleteInvoice(id) {
  const db = load()
  db.billing = db.billing.filter(b => String(b.id) !== String(id))
  save(db)
}

export function listReminders() {
  return load().reminders
}

export function getReminder(id) {
  return load().reminders.find(r => String(r.id) === String(id))
}

export function upsertReminder(payload) {
  const db = load()
  if (payload.id) {
    db.reminders = db.reminders.map(r => r.id === payload.id ? payload : r)
  } else {
    const id = db.meta.reminderSeq++
    db.reminders.push({ ...payload, id })
  }
  save(db)
  return payload.id ? payload : { ...payload, id: db.meta.reminderSeq - 1 }
}

export function deleteReminder(id) {
  const db = load()
  db.reminders = db.reminders.filter(r => String(r.id) !== String(id))
  save(db)
}