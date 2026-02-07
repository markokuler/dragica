/**
 * Shared demo data constants and population function.
 * Used by both:
 *   - app/api/cron/reset-demo/route.ts (daily reset)
 *   - scripts/setup-demo.ts (one-time setup)
 */

import { SupabaseClient } from '@supabase/supabase-js'

// =============================================
// STATIC DATA
// =============================================

export const DEMO_SERVICES = [
  { name: 'Manikir - klasičan', duration_minutes: 45, price: 1500 },
  { name: 'Manikir - gel lak', duration_minutes: 60, price: 2000 },
  { name: 'Manikir - gel nadogradnja', duration_minutes: 90, price: 3500 },
  { name: 'Pedikir - klasičan', duration_minutes: 60, price: 2000 },
  { name: 'Pedikir - spa', duration_minutes: 90, price: 3000 },
  { name: 'Nail art - po noktu', duration_minutes: 15, price: 200 },
  { name: 'Skidanje gela', duration_minutes: 30, price: 800 },
  { name: 'Manikir + Pedikir combo', duration_minutes: 105, price: 3200 },
]

export const DEMO_WORKING_HOURS = [
  { day_of_week: 1, start_time: '09:00', end_time: '20:00' },
  { day_of_week: 2, start_time: '09:00', end_time: '20:00' },
  { day_of_week: 3, start_time: '09:00', end_time: '20:00' },
  { day_of_week: 4, start_time: '09:00', end_time: '20:00' },
  { day_of_week: 5, start_time: '09:00', end_time: '20:00' },
  { day_of_week: 6, start_time: '10:00', end_time: '16:00' },
]

export const DEMO_CUSTOMERS: Array<{
  phone: string
  name: string
  notes?: string
  notification_channel?: 'whatsapp' | 'viber'
}> = [
  { phone: '+381640001001', name: 'Marija Petrović', notes: 'Redovna klijentkinja, voli gel nadogradnju. Alergična na akril.', notification_channel: 'whatsapp' },
  { phone: '+381640001002', name: 'Ana Jovanović', notes: 'Preferira prirodne boje. Dolazi svake 2 nedelje.', notification_channel: 'viber' },
  { phone: '+381640001003', name: 'Jelena Nikolić', notification_channel: 'whatsapp' },
  { phone: '+381640001004', name: 'Ivana Đorđević', notes: 'Traži uvek isti dizajn - french manikir.' },
  { phone: '+381640001005', name: 'Milica Stojanović', notification_channel: 'viber' },
  { phone: '+381640001006', name: 'Tamara Marković', notes: 'VIP klijentkinja. Uvek zakazuje combo usluge.' },
  { phone: '+381640001007', name: 'Dragana Ilić', notification_channel: 'whatsapp' },
  { phone: '+381640001008', name: 'Nevena Pavlović', notes: 'Osetljivi nokti, koristiti nežniji gel.' },
  { phone: '+381640001009', name: 'Maja Janković' },
  { phone: '+381640001010', name: 'Teodora Popović', notification_channel: 'viber' },
  { phone: '+381640001011', name: 'Katarina Stanković', notes: 'Studentkinja, preferira jeftinije opcije.' },
  { phone: '+381640001012', name: 'Sofija Živković', notification_channel: 'whatsapp' },
  { phone: '+381640001013', name: 'Nina Kostić' },
  { phone: '+381640001014', name: 'Aleksandra Todorović', notes: 'Dolazi sa ćerkom (Mina). Zakazati zajedno.', notification_channel: 'viber' },
  { phone: '+381640001015', name: 'Jovana Mitrović' },
  { phone: '+381640001016', name: 'Mina Ristić', notification_channel: 'whatsapp' },
  { phone: '+381640001017', name: 'Sara Obradović', notes: 'Nail art ljubitelj, voli šarene dizajne.' },
  { phone: '+381640001018', name: 'Kristina Simić' },
  { phone: '+381640001019', name: 'Dunja Lazarević', notification_channel: 'viber' },
  { phone: '+381640001020', name: 'Anđela Vuković', notes: 'Radi noćnu smenu, zakazuje uvek pre podne.' },
  { phone: '+381640001021', name: 'Lana Savić' },
  { phone: '+381640001022', name: 'Emilija Filipović', notification_channel: 'whatsapp' },
  { phone: '+381640001023', name: 'Tijana Đukić', notes: 'Trudnica - izbegavati jake hemikalije.' },
  { phone: '+381640001024', name: 'Natalija Gavrilović' },
  { phone: '+381640001025', name: 'Bojana Tomić', notification_channel: 'viber', notes: 'Preporuka od Marije P. Prva poseta bila 15. jan.' },
]

const TIME_SLOTS = [
  { hour: 9, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 18, minute: 30 },
  { hour: 19, minute: 0 },
]

const SAT_TIME_SLOTS = TIME_SLOTS.filter(s => s.hour >= 10 && s.hour < 16)

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// =============================================
// MAIN FUNCTION
// =============================================

export interface PopulateDemoResult {
  services: number
  customers: number
  bookings: number
  financialEntries: number
  blockedSlots: number
}

/**
 * Populates a demo tenant with realistic data.
 * Deletes existing volatile data first, then inserts fresh data.
 * Works with any Supabase client (admin or service-role).
 */
export async function populateDemoData(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<PopulateDemoResult> {
  // Delete existing volatile data in correct FK order
  await supabase.from('financial_entries').delete().eq('tenant_id', tenantId)
  await supabase.from('bookings').delete().eq('tenant_id', tenantId)
  await supabase.from('customers').delete().eq('tenant_id', tenantId)
  await supabase.from('blocked_slots').delete().eq('tenant_id', tenantId)
  await supabase.from('services').delete().eq('tenant_id', tenantId)
  await supabase.from('working_hours').delete().eq('tenant_id', tenantId)

  // Insert services
  const { data: insertedServices } = await supabase
    .from('services')
    .insert(DEMO_SERVICES.map(s => ({ ...s, tenant_id: tenantId, is_active: true })))
    .select('id, name, duration_minutes, price')

  // Insert working hours
  await supabase
    .from('working_hours')
    .insert(DEMO_WORKING_HOURS.map(wh => ({ ...wh, tenant_id: tenantId, is_active: true })))

  // Insert customers
  const { data: insertedCustomers } = await supabase
    .from('customers')
    .insert(DEMO_CUSTOMERS.map(c => ({
      tenant_id: tenantId,
      phone: c.phone,
      name: c.name,
      notes: c.notes || null,
      notification_channel: c.notification_channel || null,
    })))
    .select('id')

  if (!insertedServices?.length || !insertedCustomers?.length) {
    return { services: 0, customers: 0, bookings: 0, financialEntries: 0, blockedSlots: 0 }
  }

  const now = new Date()
  let seed = 42

  // =============================================
  // BOOKINGS: 120 days back + today + 7 days forward
  // =============================================
  const bookingsToInsert: Array<{
    tenant_id: string
    customer_id: string
    service_id: string
    start_datetime: string
    end_datetime: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'
    manage_token?: string
    created_at: string
  }> = []

  // Past 120 days
  for (let day = 120; day >= 1; day--) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    const dayOfWeek = date.getDay()

    if (dayOfWeek === 0) continue // skip Sunday

    const slots = dayOfWeek === 6 ? SAT_TIME_SLOTS : TIME_SLOTS

    // Gradually increase bookings over time (salon grows)
    const monthsAgo = Math.floor(day / 30)
    const baseCount = monthsAgo >= 3 ? 2 : monthsAgo >= 2 ? 3 : monthsAgo >= 1 ? 4 : 5
    const variance = Math.floor(seededRandom(seed++) * 2)
    const bookingsPerDay = Math.min(baseCount + variance, slots.length)

    // Pick random non-overlapping slots
    const usedSlots = new Set<number>()
    for (let b = 0; b < bookingsPerDay; b++) {
      let slotIdx: number
      let attempts = 0
      do {
        slotIdx = Math.floor(seededRandom(seed++) * slots.length)
        attempts++
      } while (usedSlots.has(slotIdx) && attempts < 20)
      if (usedSlots.has(slotIdx)) continue
      usedSlots.add(slotIdx)

      const slot = slots[slotIdx]
      const service = insertedServices[Math.floor(seededRandom(seed++) * insertedServices.length)]
      const customer = insertedCustomers[Math.floor(seededRandom(seed++) * insertedCustomers.length)]

      const start = new Date(date)
      start.setHours(slot.hour, slot.minute, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + service.duration_minutes)

      // Status: 78% completed, 10% cancelled, 5% noshow, 7% confirmed (recent past)
      const roll = seededRandom(seed++)
      let status: 'completed' | 'cancelled' | 'noshow' | 'confirmed' = 'completed'
      if (roll < 0.10) status = 'cancelled'
      else if (roll < 0.15) status = 'noshow'
      else if (roll < 0.22 && day <= 3) status = 'confirmed'

      // created_at: 0-3 days before the booking
      const createdAt = new Date(start)
      createdAt.setDate(createdAt.getDate() - Math.floor(seededRandom(seed++) * 4))

      // ~50% past bookings are "online" (have manage_token)
      const isOnline = seededRandom(seed++) < 0.50
      bookingsToInsert.push({
        tenant_id: tenantId,
        customer_id: customer.id,
        service_id: service.id,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        status,
        ...(isOnline ? { manage_token: crypto.randomUUID() } : {}),
        created_at: createdAt.toISOString(),
      })
    }
  }

  // Today's bookings - diverse statuses
  {
    const todayDow = now.getDay()
    if (todayDow !== 0) {
      const slots = todayDow === 6 ? SAT_TIME_SLOTS : TIME_SLOTS
      const todayStatuses: Array<'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'> = [
        'confirmed', 'confirmed', 'pending', 'completed', 'confirmed', 'cancelled', 'noshow',
      ]
      const todayCount = Math.min(7, slots.length)
      for (let b = 0; b < todayCount; b++) {
        const slotIdx = Math.floor(seededRandom(seed++) * slots.length)
        const slot = slots[slotIdx]
        const service = insertedServices[Math.floor(seededRandom(seed++) * insertedServices.length)]
        const customer = insertedCustomers[Math.floor(seededRandom(seed++) * insertedCustomers.length)]

        const start = new Date(now)
        start.setHours(slot.hour, slot.minute, 0, 0)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + service.duration_minutes)

        const createdAt = new Date(start)
        createdAt.setDate(createdAt.getDate() - 1)

        // ~50% of today's bookings are online
        const isTodayOnline = seededRandom(seed++) < 0.50
        bookingsToInsert.push({
          tenant_id: tenantId,
          customer_id: customer.id,
          service_id: service.id,
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
          status: todayStatuses[b % todayStatuses.length],
          ...(isTodayOnline ? { manage_token: crypto.randomUUID() } : {}),
          created_at: createdAt.toISOString(),
        })
      }
    }
  }

  // Future 7 days
  for (let day = 1; day <= 7; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() + day)
    const dayOfWeek = date.getDay()

    if (dayOfWeek === 0) continue

    const slots = dayOfWeek === 6 ? SAT_TIME_SLOTS : TIME_SLOTS
    const bookingsPerDay = 2 + Math.floor(seededRandom(seed++) * 3)

    for (let b = 0; b < bookingsPerDay; b++) {
      const slotIdx = Math.floor(seededRandom(seed++) * slots.length)
      const slot = slots[slotIdx]
      const service = insertedServices[Math.floor(seededRandom(seed++) * insertedServices.length)]
      const customer = insertedCustomers[Math.floor(seededRandom(seed++) * insertedCustomers.length)]

      const start = new Date(date)
      start.setHours(slot.hour, slot.minute, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + service.duration_minutes)

      const roll = seededRandom(seed++)
      const status: 'pending' | 'confirmed' = roll < 0.4 ? 'pending' : 'confirmed'

      // ~50% of future bookings are online
      const isFutureOnline = seededRandom(seed++) < 0.50
      bookingsToInsert.push({
        tenant_id: tenantId,
        customer_id: customer.id,
        service_id: service.id,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        status,
        ...(isFutureOnline ? { manage_token: crypto.randomUUID() } : {}),
        created_at: new Date(now).toISOString(),
      })
    }
  }

  // =============================================
  // FINANCIAL ENTRIES: 5 months, ALL categories, auto + manual
  // =============================================
  const financialEntries: Array<{
    tenant_id: string
    type: 'income' | 'expense'
    category: string
    amount: number
    description: string
    entry_date: string
    booking_id?: string
    created_at: string
  }> = []

  // Insert bookings in batches WITH .select() for booking_id linking
  for (let i = 0; i < bookingsToInsert.length; i += 500) {
    const batch = bookingsToInsert.slice(i, i + 500)
    const { data: inserted } = await supabase.from('bookings').insert(batch).select('id, status, service_id, start_datetime')
    if (inserted) {
      for (const b of inserted) {
        if (b.status === 'completed') {
          const service = insertedServices.find(s => s.id === b.service_id)
          if (service) {
            financialEntries.push({
              tenant_id: tenantId,
              type: 'income',
              category: 'booking',
              amount: service.price,
              description: service.name,
              entry_date: b.start_datetime.split('T')[0],
              booking_id: b.id,
              created_at: b.start_datetime,
            })
          }
        }
      }
    }
  }

  // Manual income: booking (ručni), products, tips, other (no booking_id)
  for (let month = 0; month < 5; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1)
    const monthStr = monthDate.toISOString().split('T')[0].substring(0, 7)

    const manualIncome = [
      { category: 'booking', amount: 1500 + Math.floor(seededRandom(seed++) * 2000), description: 'Manikir - telefonsko zakazivanje', dayOfMonth: 3 + Math.floor(seededRandom(seed++) * 3) },
      { category: 'booking', amount: 2000 + Math.floor(seededRandom(seed++) * 1500), description: 'Gel lak - walk-in klijent', dayOfMonth: 8 + Math.floor(seededRandom(seed++) * 3) },
      { category: 'booking', amount: 3000 + Math.floor(seededRandom(seed++) * 1000), description: 'Pedikir spa - preporuka', dayOfMonth: 13 + Math.floor(seededRandom(seed++) * 3) },
      { category: 'booking', amount: 1500 + Math.floor(seededRandom(seed++) * 2500), description: 'Manikir klasičan - telefonom', dayOfMonth: 18 + Math.floor(seededRandom(seed++) * 3) },
      { category: 'booking', amount: 2000 + Math.floor(seededRandom(seed++) * 2000), description: 'Gel nadogradnja - walk-in', dayOfMonth: 23 + Math.floor(seededRandom(seed++) * 3) },
      { category: 'products', amount: 1200 + Math.floor(seededRandom(seed++) * 2000), description: 'Lak za nokte - prodaja', dayOfMonth: 4 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'products', amount: 800 + Math.floor(seededRandom(seed++) * 1500), description: 'Krema za ruke - prodaja', dayOfMonth: 12 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'products', amount: 500 + Math.floor(seededRandom(seed++) * 1000), description: 'Set za negu noktiju', dayOfMonth: 20 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'tips', amount: 300 + Math.floor(seededRandom(seed++) * 700), description: 'Napojnice - nedelja 1', dayOfMonth: 7 },
      { category: 'tips', amount: 200 + Math.floor(seededRandom(seed++) * 800), description: 'Napojnice - nedelja 2', dayOfMonth: 14 },
      { category: 'tips', amount: 400 + Math.floor(seededRandom(seed++) * 600), description: 'Napojnice - nedelja 3', dayOfMonth: 21 },
      { category: 'tips', amount: 250 + Math.floor(seededRandom(seed++) * 500), description: 'Napojnice - nedelja 4', dayOfMonth: 28 },
      { category: 'other', amount: 2000 + Math.floor(seededRandom(seed++) * 3000), description: seededRandom(seed++) > 0.5 ? 'Poklon vaučer - prodaja' : 'Depozit za grupnu rezervaciju', dayOfMonth: 16 + Math.floor(seededRandom(seed++) * 8) },
    ]

    for (const inc of manualIncome) {
      const date = new Date(monthDate)
      date.setDate(Math.min(inc.dayOfMonth, 28))
      if (date > now) continue

      financialEntries.push({
        tenant_id: tenantId,
        type: 'income',
        category: inc.category,
        amount: inc.amount,
        description: inc.description,
        entry_date: date.toISOString().split('T')[0],
        created_at: date.toISOString(),
      })
    }
  }

  // Expenses: ALL categories (rent, utilities, supplies, salaries, marketing, other)
  for (let month = 0; month < 5; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1)
    const monthStr = monthDate.toISOString().split('T')[0].substring(0, 7)

    const monthlyExpenses = [
      { category: 'rent', amount: 30000, description: `Kirija - ${monthStr}`, dayOfMonth: 1 },
      { category: 'utilities', amount: 7500 + Math.floor(seededRandom(seed++) * 3000), description: `Struja + voda - ${monthStr}`, dayOfMonth: 5 },
      { category: 'utilities', amount: 3000, description: `Internet - ${monthStr}`, dayOfMonth: 10 },
      { category: 'utilities', amount: 1500, description: `Telefon - ${monthStr}`, dayOfMonth: 10 },
      { category: 'supplies', amount: 4000 + Math.floor(seededRandom(seed++) * 6000), description: 'Gel lakovi, tipsovi, turpije', dayOfMonth: 8 + Math.floor(seededRandom(seed++) * 7) },
      { category: 'supplies', amount: 2000 + Math.floor(seededRandom(seed++) * 3000), description: 'Sredstva za dezinfekciju', dayOfMonth: 15 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'supplies', amount: 1000 + Math.floor(seededRandom(seed++) * 2000), description: 'Ubrusi, vata, salvete', dayOfMonth: 18 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'salaries', amount: 45000 + Math.floor(seededRandom(seed++) * 10000), description: `Plata - pomoćnica - ${monthStr}`, dayOfMonth: 1 },
      { category: 'marketing', amount: 2000 + Math.floor(seededRandom(seed++) * 4000), description: 'Instagram/Facebook reklame', dayOfMonth: 3 },
      { category: 'marketing', amount: 1000 + Math.floor(seededRandom(seed++) * 2000), description: 'Vizit karte / flajeri', dayOfMonth: 15 + Math.floor(seededRandom(seed++) * 10) },
      { category: 'other', amount: 2000 + Math.floor(seededRandom(seed++) * 3000), description: seededRandom(seed++) > 0.5 ? 'Čišćenje prostora' : 'Popravka klime', dayOfMonth: 22 + Math.floor(seededRandom(seed++) * 5) },
    ]

    // Occasional big expense
    if (seededRandom(seed++) > 0.5) {
      monthlyExpenses.push({
        category: 'other',
        amount: 5000 + Math.floor(seededRandom(seed++) * 15000),
        description: seededRandom(seed++) > 0.5 ? 'Nova UV lampa' : 'Frezar za nokte',
        dayOfMonth: 20 + Math.floor(seededRandom(seed++) * 8),
      })
    }

    for (const exp of monthlyExpenses) {
      const date = new Date(monthDate)
      date.setDate(Math.min(exp.dayOfMonth, 28))
      if (date > now) continue

      financialEntries.push({
        tenant_id: tenantId,
        type: 'expense',
        category: exp.category,
        amount: exp.amount,
        description: exp.description,
        entry_date: date.toISOString().split('T')[0],
        created_at: date.toISOString(),
      })
    }
  }

  // Insert financials in batches
  for (let i = 0; i < financialEntries.length; i += 500) {
    const batch = financialEntries.slice(i, i + 500)
    await supabase.from('financial_entries').insert(batch)
  }

  // =============================================
  // BLOCKED SLOTS
  // =============================================
  const blockedSlots = []

  // Lunch break day after tomorrow
  const dayAfterTomorrow = new Date(now)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  if (dayAfterTomorrow.getDay() !== 0) {
    const startBs = new Date(dayAfterTomorrow)
    startBs.setHours(13, 0, 0, 0)
    const endBs = new Date(dayAfterTomorrow)
    endBs.setHours(14, 0, 0, 0)
    blockedSlots.push({
      tenant_id: tenantId,
      start_datetime: startBs.toISOString(),
      end_datetime: endBs.toISOString(),
      reason: 'Pauza za ručak',
    })
  }

  // Day off in 5 days
  const dayOff = new Date(now)
  dayOff.setDate(dayOff.getDate() + 5)
  if (dayOff.getDay() !== 0) {
    const startDo = new Date(dayOff)
    startDo.setHours(0, 0, 0, 0)
    const endDo = new Date(dayOff)
    endDo.setHours(23, 59, 0, 0)
    blockedSlots.push({
      tenant_id: tenantId,
      start_datetime: startDo.toISOString(),
      end_datetime: endDo.toISOString(),
      reason: 'Slobodan dan',
    })
  }

  if (blockedSlots.length > 0) {
    await supabase.from('blocked_slots').insert(blockedSlots)
  }

  return {
    services: insertedServices.length,
    customers: insertedCustomers.length,
    bookings: bookingsToInsert.length,
    financialEntries: financialEntries.length,
    blockedSlots: blockedSlots.length,
  }
}

// =============================================
// ADMIN DEMO DATA
// =============================================

const DEMO_SALONS = [
  { slug: 'bella-nails', name: 'Bella Nails Studio', email: 'bella@demo.local', phone: '+381601100001', subdomain: 'bella-nails', accent_color: '#E91E63', description: 'Luksuzni salon za nokte u centru Novog Sada.', city: 'Novi Sad' },
  { slug: 'glamour-studio', name: 'Glamour Beauty Studio', email: 'glamour@demo.local', phone: '+381601100002', subdomain: 'glamour-studio', accent_color: '#9C27B0', description: 'Kompletan beauty tretman na jednom mestu.', city: 'Beograd' },
  { slug: 'nails-art-ns', name: 'Nails Art NS', email: 'nailsart@demo.local', phone: '+381601100003', subdomain: 'nails-art-ns', accent_color: '#FF5722', description: 'Specijalizovani za nail art i gel nadogradnju.', city: 'Novi Sad' },
  { slug: 'pink-salon', name: 'Pink Nail Salon', email: 'pink@demo.local', phone: '+381601100004', subdomain: 'pink-salon', accent_color: '#FF4081', description: 'Moderan salon za mlade. Instagram: @pinknails', city: 'Niš' },
  { slug: 'studio-m', name: 'Studio M Beauty', email: 'studiom@demo.local', phone: '+381601100005', subdomain: 'studio-m', accent_color: '#00BCD4', description: 'Premium beauty salon sa 10 godina iskustva.', city: 'Beograd' },
  { slug: 'lux-nails', name: 'Lux Nails Kragujevac', email: 'lux@demo.local', phone: '+381601100006', subdomain: 'lux-nails', accent_color: '#FFC107', description: 'Profesionalna nega noktiju u Kragujevcu.', city: 'Kragujevac' },
  { slug: 'ana-beauty', name: 'Ana Beauty Bar', email: 'ana@demo.local', phone: '+381601100007', subdomain: 'ana-beauty', accent_color: '#4CAF50', description: 'Nail bar i kozmetički salon.', city: 'Subotica' },
  { slug: 'royal-nails', name: 'Royal Nails', email: 'royal@demo.local', phone: '+381601100008', subdomain: 'royal-nails', accent_color: '#673AB7', description: 'Kraljevski tretman za vaše nokte.', city: 'Beograd' },
  { slug: 'spa-noktiju', name: 'Spa Noktiju Zemun', email: 'spa@demo.local', phone: '+381601100009', subdomain: 'spa-noktiju', accent_color: '#009688', description: 'Spa tretmani za ruke i noge.', city: 'Zemun' },
  { slug: 'moda-nails', name: 'Moda Nails', email: 'moda@demo.local', phone: '+381601100010', subdomain: 'moda-nails', accent_color: '#795548', description: 'U trendu sa najnovijim nail dizajnovima.', city: 'Čačak' },
  { slug: 'elite-beauty', name: 'Elite Beauty Salon', email: 'elite@demo.local', phone: '+381601100011', subdomain: 'elite-beauty', accent_color: '#607D8B', description: 'Ekskluzivan salon u strogom centru.', city: 'Beograd' },
  { slug: 'maja-nails', name: 'Maja Nails & More', email: 'maja@demo.local', phone: '+381601100012', subdomain: 'maja-nails', accent_color: '#F44336', description: 'Noktići, trepavice i obrve.', city: 'Pančevo' },
]

// Subscription status distribution for demo salons
const DEMO_SALON_STATUSES: Array<{
  is_active: boolean
  subscription_status: string
  // days relative to now for subscription_expires_at (negative = past)
  expires_days: number
  // days ago salon was created
  created_days_ago: number
}> = [
  { is_active: true, subscription_status: 'active', expires_days: 180, created_days_ago: 150 },   // Active, 6 months left
  { is_active: true, subscription_status: 'active', expires_days: 45, created_days_ago: 120 },    // Active, month+ left
  { is_active: true, subscription_status: 'active', expires_days: 300, created_days_ago: 90 },    // Active, yearly plan
  { is_active: true, subscription_status: 'active', expires_days: 20, created_days_ago: 60 },     // Active, weeks left
  { is_active: true, subscription_status: 'active', expires_days: 5, created_days_ago: 35 },      // Active, expiring soon!
  { is_active: true, subscription_status: 'active', expires_days: 3, created_days_ago: 95 },      // Active, expiring very soon!
  { is_active: true, subscription_status: 'active', expires_days: 60, created_days_ago: 25 },     // Active, 2 months left
  { is_active: false, subscription_status: 'expired', expires_days: -15, created_days_ago: 180 },  // Expired 15 days ago
  { is_active: false, subscription_status: 'expired', expires_days: -45, created_days_ago: 200 },  // Expired 45 days ago
  { is_active: true, subscription_status: 'payment_pending', expires_days: -3, created_days_ago: 70 }, // Payment pending
  { is_active: true, subscription_status: 'active', expires_days: 12, created_days_ago: 8 },      // New, trial ending soon
  { is_active: false, subscription_status: 'expired', expires_days: -60, created_days_ago: 250 },  // Long expired, inactive
]

const DEMO_PLANS = [
  { name: 'Probni period', duration_days: 14, price: 0, is_trial: true },
  { name: 'Mesečni', duration_days: 30, price: 2500, is_trial: false },
  { name: 'Kvartalni', duration_days: 90, price: 6000, is_trial: false },
  { name: 'Godišnji', duration_days: 365, price: 20000, is_trial: false },
]

const DEMO_COUPONS = [
  { code: 'DOBRODOSLI', discount_type: 'percentage', discount_value: 20, max_uses: 50, valid_days: 60, description: 'Popust dobrodošlice za nove salone', current_uses: 12 },
  { code: 'LETO2025', discount_type: 'percentage', discount_value: 15, max_uses: 100, valid_days: -30, description: 'Letnja akcija 2025', current_uses: 87 },
  { code: 'FLAT500', discount_type: 'fixed', discount_value: 500, max_uses: 30, valid_days: 90, description: '500 RSD popust na mesečni plan', current_uses: 5 },
  { code: 'VIP2025', discount_type: 'percentage', discount_value: 30, max_uses: 10, valid_days: 30, description: 'VIP popust za preporuku', current_uses: 10 },
  { code: 'PROBA', discount_type: 'fixed', discount_value: 1000, max_uses: null, valid_days: 120, description: 'Produženi probni popust', current_uses: 23 },
  { code: 'STARI', discount_type: 'percentage', discount_value: 10, max_uses: 200, valid_days: -90, description: 'Stara akcija - istekla', current_uses: 142 },
]

export interface PopulateAdminDemoResult {
  salons: number
  plans: number
  subscriptions: number
  payments: number
  finances: number
  coupons: number
  auditEntries: number
  reminders: number
  tags: number
  salonServices: number
  salonCustomers: number
  salonBookings: number
  contactHistory: number
}

export async function populateAdminDemoData(
  supabase: SupabaseClient,
  mainDemoTenantId: string,
): Promise<PopulateAdminDemoResult> {
  const now = new Date()
  let seed = 1000

  // =============================================
  // CLEANUP: Delete previous admin demo data
  // =============================================
  // Delete demo tenants (NOT the main demo salon)
  const { data: existingDemoTenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_demo', true)
    .neq('id', mainDemoTenantId)

  if (existingDemoTenants?.length) {
    const ids = existingDemoTenants.map(t => t.id)
    // Cascade handles: services, bookings, customers, etc.
    await supabase.from('payments').delete().in('tenant_id', ids)
    await supabase.from('tenant_subscriptions').delete().in('tenant_id', ids)
    await supabase.from('admin_reminders').delete().in('tenant_id', ids)
    await supabase.from('tenants').delete().in('id', ids)
  }

  // Delete demo-flagged admin entries
  await supabase.from('admin_financial_entries').delete().eq('is_demo', true)
  await supabase.from('audit_log').delete().eq('is_demo', true)
  await supabase.from('coupons').delete().eq('is_demo', true)

  // =============================================
  // SUBSCRIPTION PLANS — ensure trial plan exists
  // =============================================
  const { data: existingTrialPlan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('is_trial', true)
    .limit(1)
    .maybeSingle()

  if (!existingTrialPlan) {
    await supabase.from('subscription_plans').insert({
      name: 'Probni period',
      duration_days: 14,
      price: 0,
      is_trial: true,
      is_active: true,
    })
  }

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, name, duration_days, price, is_trial')

  if (!plans?.length) {
    return { salons: 0, plans: 0, subscriptions: 0, payments: 0, finances: 0, coupons: 0, auditEntries: 0, reminders: 0, tags: 0, salonServices: 0, salonCustomers: 0, salonBookings: 0, contactHistory: 0 }
  }

  // =============================================
  // DEMO TENANTS (12 salons)
  // =============================================
  const demoTenants: Array<{ id: string; name: string; created_at: string; subscription_status: string }> = []

  for (let i = 0; i < DEMO_SALONS.length; i++) {
    const salon = DEMO_SALONS[i]
    const status = DEMO_SALON_STATUSES[i]
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - status.created_days_ago)
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + status.expires_days)

    const { data: tenant } = await supabase
      .from('tenants')
      .insert({
        slug: salon.slug,
        name: salon.name,
        email: salon.email,
        phone: salon.phone,
        subdomain: salon.subdomain,
        accent_color: salon.accent_color,
        description: salon.description,
        is_active: status.is_active,
        is_demo: true,
        subscription_status: status.subscription_status,
        subscription_expires_at: expiresAt.toISOString(),
        created_at: createdAt.toISOString(),
      })
      .select('id, name, created_at, subscription_status')
      .single()

    if (tenant) {
      demoTenants.push(tenant)
    }
  }

  // Also include the main demo tenant
  const allDemoTenantIds = [mainDemoTenantId, ...demoTenants.map(t => t.id)]

  // =============================================
  // TENANT SUBSCRIPTIONS
  // =============================================
  const subscriptionsToInsert: Array<{
    tenant_id: string
    plan_id: string
    started_at: string
    expires_at: string
    status: string
  }> = []

  for (let i = 0; i < demoTenants.length; i++) {
    const tenant = demoTenants[i]
    const statusInfo = DEMO_SALON_STATUSES[i]
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + statusInfo.expires_days)
    const startedAt = new Date(expiresAt)

    // Pick a plan based on salon characteristics
    let plan
    if (statusInfo.created_days_ago <= 14) {
      plan = plans.find(p => p.is_trial) || plans[0]
      startedAt.setDate(startedAt.getDate() - 14)
    } else if (statusInfo.expires_days > 200) {
      plan = plans.find(p => p.name === 'Godišnji') || plans[plans.length - 1]
      startedAt.setDate(startedAt.getDate() - 365)
    } else if (statusInfo.expires_days > 50) {
      plan = plans.find(p => p.name === 'Kvartalni') || plans[2] || plans[1]
      startedAt.setDate(startedAt.getDate() - 90)
    } else {
      plan = plans.find(p => p.name === 'Mesečni') || plans[1] || plans[0]
      startedAt.setDate(startedAt.getDate() - 30)
    }

    if (plan) {
      subscriptionsToInsert.push({
        tenant_id: tenant.id,
        plan_id: plan.id,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: statusInfo.subscription_status === 'expired' ? 'expired'
          : statusInfo.subscription_status === 'payment_pending' ? 'payment_pending'
          : 'active',
      })
    }
  }

  // Main demo tenant subscription
  const mainPlan = plans.find(p => p.name === 'Godišnji') || plans[plans.length - 1]
  if (mainPlan) {
    // Delete existing subscription for main tenant
    await supabase.from('tenant_subscriptions').delete().eq('tenant_id', mainDemoTenantId)
    subscriptionsToInsert.push({
      tenant_id: mainDemoTenantId,
      plan_id: mainPlan.id,
      started_at: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
      expires_at: new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString(),
      status: 'active',
    })
  }

  if (subscriptionsToInsert.length > 0) {
    await supabase.from('tenant_subscriptions').insert(subscriptionsToInsert)
  }

  // =============================================
  // PAYMENTS (25+ over 6 months)
  // =============================================
  const paymentsToInsert: Array<{
    tenant_id: string
    plan_id: string
    amount: number
    payment_date: string
    notes: string | null
    created_at: string
  }> = []

  // Generate payments for active/paid tenants
  for (const tenant of [...demoTenants, { id: mainDemoTenantId, name: 'Dragica Demo Salon', subscription_status: 'active', created_at: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString() }]) {
    if (tenant.subscription_status === 'expired' && seededRandom(seed++) > 0.3) continue

    // 1-4 payments per tenant
    const paymentCount = 1 + Math.floor(seededRandom(seed++) * 4)
    for (let p = 0; p < paymentCount; p++) {
      const plan = plans[Math.floor(seededRandom(seed++) * plans.length)]
      if (!plan || plan.is_trial) continue

      const daysAgo = Math.floor(seededRandom(seed++) * 180)
      const paymentDate = new Date(now)
      paymentDate.setDate(paymentDate.getDate() - daysAgo)

      paymentsToInsert.push({
        tenant_id: tenant.id,
        plan_id: plan.id,
        amount: plan.price,
        payment_date: paymentDate.toISOString().split('T')[0],
        notes: seededRandom(seed++) > 0.7 ? 'Uplata na račun' : null,
        created_at: paymentDate.toISOString(),
      })
    }
  }

  if (paymentsToInsert.length > 0) {
    await supabase.from('payments').insert(paymentsToInsert)
  }

  // =============================================
  // ADMIN FINANCIAL ENTRIES (is_demo=true)
  // =============================================
  const adminFinances: Array<{
    type: 'income' | 'expense'
    category: string
    amount: number
    description: string
    entry_date: string
    is_demo: boolean
    created_at: string
  }> = []

  for (let month = 0; month < 6; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1)

    // Income: subscriptions, consulting, partnerships, other
    const monthlyIncome = [
      { category: 'subscriptions', amount: 35000 + Math.floor(seededRandom(seed++) * 15000), description: `Mesečne pretplate - ${month === 0 ? 'tekući' : 'prethodni'} mesec`, day: 1 },
      { category: 'subscriptions', amount: 15000 + Math.floor(seededRandom(seed++) * 10000), description: 'Nove pretplate', day: 10 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'subscriptions', amount: 20000 + Math.floor(seededRandom(seed++) * 20000), description: 'Godišnje pretplate', day: 15 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'consulting', amount: 5000 + Math.floor(seededRandom(seed++) * 10000), description: 'Konsultacije za nove salone', day: 5 + Math.floor(seededRandom(seed++) * 10) },
      { category: 'partnerships', amount: 3000 + Math.floor(seededRandom(seed++) * 7000), description: seededRandom(seed++) > 0.5 ? 'Partnerstvo sa dobavljačem gel lakova' : 'Affiliate program', day: 12 + Math.floor(seededRandom(seed++) * 10) },
      { category: 'other', amount: 1000 + Math.floor(seededRandom(seed++) * 5000), description: seededRandom(seed++) > 0.5 ? 'Prodaja edukativnog materijala' : 'Sponzorstvo na sajmu lepote', day: 20 + Math.floor(seededRandom(seed++) * 5) },
    ]

    // Expenses: hosting, marketing, salaries, software, office, legal, other
    const monthlyExpenses = [
      { category: 'hosting', amount: 8000 + Math.floor(seededRandom(seed++) * 4000), description: `Vercel + Supabase hosting`, day: 1 },
      { category: 'hosting', amount: 2000 + Math.floor(seededRandom(seed++) * 1000), description: 'Domain + SSL', day: 1 },
      { category: 'marketing', amount: 10000 + Math.floor(seededRandom(seed++) * 15000), description: 'Google Ads + Instagram reklame', day: 3 },
      { category: 'marketing', amount: 3000 + Math.floor(seededRandom(seed++) * 5000), description: 'Influencer saradnje', day: 15 + Math.floor(seededRandom(seed++) * 5) },
      { category: 'salaries', amount: 120000 + Math.floor(seededRandom(seed++) * 30000), description: 'Plate tima', day: 1 },
      { category: 'software', amount: 5000 + Math.floor(seededRandom(seed++) * 3000), description: 'Licence (Figma, GitHub, Slack)', day: 5 },
      { category: 'office', amount: 15000 + Math.floor(seededRandom(seed++) * 5000), description: 'Zakup kancelarije', day: 1 },
      { category: 'legal', amount: 5000 + Math.floor(seededRandom(seed++) * 10000), description: seededRandom(seed++) > 0.5 ? 'Računovodstvo' : 'Pravni konsultant', day: 10 + Math.floor(seededRandom(seed++) * 10) },
      { category: 'other', amount: 2000 + Math.floor(seededRandom(seed++) * 5000), description: seededRandom(seed++) > 0.5 ? 'Teambuilding' : 'Konferencija / edukacija', day: 18 + Math.floor(seededRandom(seed++) * 8) },
    ]

    for (const inc of monthlyIncome) {
      const date = new Date(monthDate)
      date.setDate(Math.min(inc.day, 28))
      if (date > now) continue
      adminFinances.push({
        type: 'income', category: inc.category, amount: inc.amount,
        description: inc.description, entry_date: date.toISOString().split('T')[0],
        is_demo: true, created_at: date.toISOString(),
      })
    }

    for (const exp of monthlyExpenses) {
      const date = new Date(monthDate)
      date.setDate(Math.min(exp.day, 28))
      if (date > now) continue
      adminFinances.push({
        type: 'expense', category: exp.category, amount: exp.amount,
        description: exp.description, entry_date: date.toISOString().split('T')[0],
        is_demo: true, created_at: date.toISOString(),
      })
    }
  }

  if (adminFinances.length > 0) {
    await supabase.from('admin_financial_entries').insert(adminFinances)
  }

  // =============================================
  // COUPONS (is_demo=true)
  // =============================================
  const couponsToInsert = DEMO_COUPONS.map(c => {
    const validFrom = new Date(now)
    validFrom.setDate(validFrom.getDate() - 30)
    const validUntil = c.valid_days > 0
      ? new Date(now.getTime() + c.valid_days * 86400000)
      : new Date(now.getTime() + c.valid_days * 86400000) // negative = past

    return {
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses,
      valid_from: validFrom.toISOString().split('T')[0],
      valid_until: validUntil.toISOString().split('T')[0],
      description: c.description,
      is_active: c.valid_days > 0 && (c.max_uses === null || c.current_uses < c.max_uses),
      is_demo: true,
      current_uses: c.current_uses,
    }
  })

  // Check if coupons table has current_uses column
  const couponInsertData = couponsToInsert.map(({ current_uses, ...rest }) => rest)
  await supabase.from('coupons').insert(couponInsertData)

  // =============================================
  // AUDIT LOG (is_demo=true)
  // =============================================
  const auditEntries: Array<{
    action: string
    entity_type: string
    entity_id: string | null
    entity_name: string | null
    details: Record<string, unknown> | null
    is_demo: boolean
    created_at: string
  }> = []

  // Generate diverse audit entries over past 30 days
  const auditActions = [
    { action: 'create', entity_type: 'salon', entity_name: 'Bella Nails Studio', details: { plan: 'Mesečni', city: 'Novi Sad' } },
    { action: 'create', entity_type: 'salon', entity_name: 'Glamour Beauty Studio', details: { plan: 'Kvartalni', city: 'Beograd' } },
    { action: 'create', entity_type: 'salon', entity_name: 'Pink Nail Salon', details: { plan: 'Probni period', city: 'Niš' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Bella Nails Studio', details: { amount: 2500, plan: 'Mesečni' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Studio M Beauty', details: { amount: 6000, plan: 'Kvartalni' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Royal Nails', details: { amount: 20000, plan: 'Godišnji' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Nails Art NS', details: { amount: 2500, plan: 'Mesečni' } },
    { action: 'update', entity_type: 'salon', entity_name: 'Lux Nails Kragujevac', details: { field: 'status', from: 'inactive', to: 'active' } },
    { action: 'update', entity_type: 'salon', entity_name: 'Moda Nails', details: { field: 'subscription', from: 'expired', to: 'active' } },
    { action: 'update', entity_type: 'settings', entity_name: 'Sistemska podešavanja', details: { field: 'reminder_hours', from: 24, to: 48 } },
    { action: 'create', entity_type: 'coupon', entity_name: 'DOBRODOSLI', details: { discount: '20%', max_uses: 50 } },
    { action: 'create', entity_type: 'coupon', entity_name: 'FLAT500', details: { discount: '500 RSD', max_uses: 30 } },
    { action: 'update', entity_type: 'coupon', entity_name: 'LETO2025', details: { field: 'is_active', to: false } },
    { action: 'delete', entity_type: 'salon', entity_name: 'Test Salon (obrisan)', details: { reason: 'Duplikat' } },
    { action: 'login', entity_type: 'user', entity_name: 'demo-admin@dragica.local', details: { ip: '188.2.xx.xx' } },
    { action: 'login', entity_type: 'user', entity_name: 'demo-admin@dragica.local', details: { ip: '188.2.xx.xx' } },
    { action: 'login', entity_type: 'user', entity_name: 'demo-admin@dragica.local', details: { ip: '93.87.xx.xx' } },
    { action: 'view', entity_type: 'salon', entity_name: 'Dragica Demo Salon', details: { action: 'god_mode' } },
    { action: 'view', entity_type: 'salon', entity_name: 'Bella Nails Studio', details: { action: 'god_mode' } },
    { action: 'update', entity_type: 'user', entity_name: 'demo-admin@dragica.local', details: { field: 'password', note: 'Promenjena lozinka' } },
    { action: 'create', entity_type: 'salon', entity_name: 'Elite Beauty Salon', details: { plan: 'Mesečni', city: 'Beograd' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Ana Beauty Bar', details: { amount: 2500, plan: 'Mesečni' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Glamour Beauty Studio', details: { amount: 6000, plan: 'Kvartalni' } },
    { action: 'update', entity_type: 'salon', entity_name: 'Spa Noktiju Zemun', details: { field: 'email', from: 'old@demo.local', to: 'spa@demo.local' } },
    { action: 'create', entity_type: 'salon', entity_name: 'Maja Nails & More', details: { plan: 'Probni period', city: 'Pančevo' } },
    { action: 'payment', entity_type: 'payment', entity_name: 'Lux Nails Kragujevac', details: { amount: 2500, plan: 'Mesečni' } },
    { action: 'update', entity_type: 'settings', entity_name: 'Plan: Mesečni', details: { field: 'price', from: 2000, to: 2500 } },
    { action: 'delete', entity_type: 'coupon', entity_name: 'STARI_TEST', details: { reason: 'Istekao, neaktivan' } },
    { action: 'login', entity_type: 'user', entity_name: 'demo-admin@dragica.local', details: { ip: '188.2.xx.xx' } },
    { action: 'create', entity_type: 'salon', entity_name: 'Lux Nails Kragujevac', details: { plan: 'Mesečni', city: 'Kragujevac' } },
  ]

  for (let i = 0; i < auditActions.length; i++) {
    const entry = auditActions[i]
    const daysAgo = Math.floor((i / auditActions.length) * 30)
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - daysAgo)
    createdAt.setHours(8 + Math.floor(seededRandom(seed++) * 12), Math.floor(seededRandom(seed++) * 60))

    auditEntries.push({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: null,
      entity_name: entry.entity_name,
      details: entry.details as Record<string, unknown>,
      is_demo: true,
      created_at: createdAt.toISOString(),
    })
  }

  if (auditEntries.length > 0) {
    await supabase.from('audit_log').insert(auditEntries)
  }

  // =============================================
  // ADMIN REMINDERS
  // =============================================
  const reminders = [
    { tenant_id: demoTenants[7]?.id, title: 'Kontaktirati Spa Noktiju - istekla pretplata', description: 'Pretplata istekla pre 15 dana. Ponuditi popust za obnovu.', days: -3, completed: false },
    { tenant_id: demoTenants[9]?.id, title: 'Pratiti uplatu - Moda Nails', description: 'Čeka se uplata za Mesečni plan. Proveriti status.', days: -1, completed: false },
    { tenant_id: demoTenants[4]?.id, title: 'Studio M - ističe pretplata za 5 dana', description: 'Poslati podsetnik za produženje pretplate.', days: 0, completed: false },
    { tenant_id: demoTenants[0]?.id, title: 'Bella Nails - proveriti integraciju', description: 'Klijent prijavio problem sa online zakazivanjem.', days: -5, completed: true },
    { tenant_id: demoTenants[1]?.id, title: 'Glamour Studio - zakazati demo', description: 'Zainteresovani za premium features. Zakazati online demo.', days: 2, completed: false },
    { tenant_id: demoTenants[5]?.id, title: 'Lux Nails - upgrade na Godišnji', description: 'Razgovarati o prelasku na godišnji plan sa popustom.', days: 5, completed: false },
    { tenant_id: mainDemoTenantId, title: 'Dragica Demo - ažurirati demo podatke', description: 'Proveriti da li su demo podaci ažurni za prezentacije.', days: -7, completed: true },
  ]

  const remindersToInsert = reminders
    .filter(r => r.tenant_id)
    .map(r => {
      const reminderDate = new Date(now)
      reminderDate.setDate(reminderDate.getDate() + r.days)
      return {
        tenant_id: r.tenant_id,
        title: r.title,
        description: r.description,
        reminder_date: reminderDate.toISOString().split('T')[0],
        is_completed: r.completed,
        completed_at: r.completed ? new Date(now.getTime() - 86400000).toISOString() : null,
      }
    })

  if (remindersToInsert.length > 0) {
    await supabase.from('admin_reminders').insert(remindersToInsert)
  }

  // =============================================
  // SALON TAGS (global, upsert) + ASSIGNMENTS
  // =============================================
  const DEMO_TAGS = [
    { name: 'VIP klijent', color: '#FFD700' },
    { name: 'Novi salon', color: '#4CAF50' },
    { name: 'Problem', color: '#F44336' },
    { name: 'Redovan', color: '#2196F3' },
    { name: 'Preporuka', color: '#9C27B0' },
    { name: 'Probni', color: '#FF9800' },
  ]

  for (const tag of DEMO_TAGS) {
    await supabase.from('salon_tags').upsert(tag, { onConflict: 'name' })
  }

  const { data: allTags } = await supabase.from('salon_tags').select('id, name')
  let totalTagAssignments = 0

  if (allTags?.length && demoTenants.length) {
    await supabase.from('tenant_tags').delete().in('tenant_id', demoTenants.map(t => t.id))

    const tagMap = Object.fromEntries(allTags.map(t => [t.name, t.id]))
    const TAG_ASSIGNMENTS: string[][] = [
      ['VIP klijent', 'Redovan'],     // 0: Bella Nails
      ['VIP klijent', 'Preporuka'],   // 1: Glamour
      ['Novi salon'],                  // 2: Nails Art NS
      ['Probni'],                      // 3: Pink Salon
      ['VIP klijent', 'Redovan'],     // 4: Studio M
      ['Problem'],                     // 5: Lux Nails
      ['Novi salon', 'Preporuka'],    // 6: Ana Beauty
      ['VIP klijent'],                // 7: Royal Nails
      ['Problem'],                     // 8: Spa Noktiju
      ['Redovan'],                     // 9: Moda Nails
      ['VIP klijent', 'Preporuka'],  // 10: Elite Beauty
      ['Probni', 'Novi salon'],      // 11: Maja Nails
    ]

    const tagAssignments: Array<{ tenant_id: string; tag_id: string }> = []
    for (let i = 0; i < demoTenants.length && i < TAG_ASSIGNMENTS.length; i++) {
      for (const tagName of TAG_ASSIGNMENTS[i]) {
        if (tagMap[tagName]) {
          tagAssignments.push({ tenant_id: demoTenants[i].id, tag_id: tagMap[tagName] })
        }
      }
    }

    if (tagAssignments.length > 0) {
      await supabase.from('tenant_tags').insert(tagAssignments)
      totalTagAssignments = tagAssignments.length
    }
  }

  // =============================================
  // ADMIN NOTES on each demo tenant
  // =============================================
  const ADMIN_NOTES = [
    'Odlična klijentkinja, uvek plaća na vreme. Zainteresovana za godišnji plan sa popustom. Kontakt: Milena (vlasnica).',
    'Veliki salon, 3 radnice. Razmatraju prelazak na Godišnji plan. Imaju aktivan Instagram (5k pratilaca). Potencijal za case study.',
    'Specijalizovani za nail art. Mlad salon, raste brzo. Trebalo bi pratiti broj zakazivanja mesečno.',
    'Salon za mlade klijente. Koriste Instagram za promociju. Probni period - pratiti konverziju u plaćeni plan.',
    'Premium salon sa dugogodišnjim iskustvom. Jedan od prvih korisnika platforme. Veoma zadovoljni.',
    'Imali problem sa online zakazivanjem prošle nedelje - rešeno. Pratiti da li se ponavlja. Kontakt: Dragan (vlasnik).',
    'Nova klijentkinja, došla preko preporuke od Bella Nails. Nail bar koncept - zainteresovani za integraciju sa društvenim mrežama.',
    'Lojalan korisnik, na godišnjem planu. Predložiti affiliate program. Kontakt osoba: Nemanja.',
    'Spa koncept, specifične potrebe za zakazivanje (duži termini 90-120min). Razmotriti custom podešavanja za trajanje usluga.',
    'Srednji salon u Čačku. Koristili konkurentsku platformu pre nas. Uporediti iskustvo posle 3 meseca korišćenja.',
    'Ekskluzivan salon, visoke cene. Zainteresovani za premium branding opcije na booking stranici. Prioritetan klijent.',
    'Noktići + trepavice + obrve - multi-uslužni salon. Trebaju im kategorije usluga. Feature request #127.',
  ]

  for (let i = 0; i < demoTenants.length && i < ADMIN_NOTES.length; i++) {
    await supabase.from('tenants').update({ admin_notes: ADMIN_NOTES[i] }).eq('id', demoTenants[i].id)
  }

  // =============================================
  // PER-SALON DATA: services, working_hours, customers, bookings
  // =============================================
  const CUSTOMER_NAMES = [
    'Jovana Marić', 'Ivana Petrović', 'Mila Bogdanović', 'Dušica Cvetković', 'Vesna Đurić',
    'Zorica Jokić', 'Snežana Lazić', 'Gordana Milić', 'Biljana Pavić', 'Tatjana Radić',
    'Mirjana Savić', 'Nataša Tomić', 'Valentina Urošević', 'Olivera Filipović', 'Dragica Ćirić',
  ]

  const CUSTOMER_NOTES_POOL = [
    'Redovna klijentkinja, dolazi svake 2 nedelje.',
    'Preferira gel lakove svetlih boja.',
    'Alergična na akrilne materijale - koristiti gel.',
    'VIP - uvek zakazuje duže termine.',
    'Studentkinja, traži akcijske cene.',
  ]

  let totalSalonServices = 0
  let totalSalonCustomers = 0
  let totalSalonBookings = 0
  let totalContactHistory = 0

  for (let si = 0; si < demoTenants.length; si++) {
    const tenant = demoTenants[si]
    const statusInfo = DEMO_SALON_STATUSES[si]

    // --- Services ---
    const serviceCount = 3 + Math.floor(seededRandom(seed++) * 5) // 3-7
    const priceMultiplier = 0.8 + seededRandom(seed++) * 0.4 // 0.8x - 1.2x
    const salonServices = DEMO_SERVICES
      .slice(0, serviceCount)
      .map(s => ({
        ...s,
        tenant_id: tenant.id,
        price: Math.round(s.price * priceMultiplier / 100) * 100,
        is_active: seededRandom(seed++) > 0.1,
      }))

    const { data: insertedSvcs } = await supabase
      .from('services')
      .insert(salonServices)
      .select('id, name, duration_minutes, price')

    totalSalonServices += insertedSvcs?.length || 0

    // --- Working Hours ---
    const whData = DEMO_WORKING_HOURS.map(wh => ({
      ...wh,
      tenant_id: tenant.id,
      is_active: true,
    }))
    // Some salons don't work Saturdays
    if (seededRandom(seed++) > 0.7) {
      whData.pop()
    }
    await supabase.from('working_hours').insert(whData)

    // --- Customers ---
    const customerCount = 5 + Math.floor(seededRandom(seed++) * 11) // 5-15
    const salonCustomers = []
    for (let ci = 0; ci < customerCount; ci++) {
      salonCustomers.push({
        tenant_id: tenant.id,
        phone: `+3816400${(si + 2).toString().padStart(2, '0')}${(ci + 1).toString().padStart(3, '0')}`,
        name: CUSTOMER_NAMES[ci % CUSTOMER_NAMES.length],
        notes: ci < 3 ? CUSTOMER_NOTES_POOL[ci % CUSTOMER_NOTES_POOL.length] : null,
        notification_channel: ci % 3 === 0 ? 'whatsapp' : ci % 3 === 1 ? 'viber' : null,
      })
    }

    const { data: insertedCusts } = await supabase
      .from('customers')
      .insert(salonCustomers)
      .select('id')

    totalSalonCustomers += insertedCusts?.length || 0

    if (!insertedSvcs?.length || !insertedCusts?.length) continue

    // --- Bookings ---
    const salonBookings: Array<{
      tenant_id: string
      customer_id: string
      service_id: string
      start_datetime: string
      end_datetime: string
      status: string
      manage_token?: string
    }> = []

    const daysOfHistory = Math.min(statusInfo.created_days_ago, 90)
    for (let day = daysOfHistory; day >= 1; day--) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0) continue

      const slots = dayOfWeek === 6 ? SAT_TIME_SLOTS : TIME_SLOTS
      const bookingsPerDay = 1 + Math.floor(seededRandom(seed++) * 3) // 1-3
      const usedSlots = new Set<number>()

      for (let b = 0; b < bookingsPerDay; b++) {
        let slotIdx: number
        let attempts = 0
        do {
          slotIdx = Math.floor(seededRandom(seed++) * slots.length)
          attempts++
        } while (usedSlots.has(slotIdx) && attempts < 10)
        if (usedSlots.has(slotIdx)) continue
        usedSlots.add(slotIdx)

        const slot = slots[slotIdx]
        const svc = insertedSvcs[Math.floor(seededRandom(seed++) * insertedSvcs.length)]
        const cust = insertedCusts[Math.floor(seededRandom(seed++) * insertedCusts.length)]

        const start = new Date(date)
        start.setHours(slot.hour, slot.minute, 0, 0)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + svc.duration_minutes)

        const roll = seededRandom(seed++)
        let status = 'completed'
        if (roll < 0.08) status = 'cancelled'
        else if (roll < 0.13) status = 'noshow'
        else if (roll < 0.20 && day <= 5) status = 'confirmed'
        else if (roll < 0.25 && day <= 3) status = 'pending'

        salonBookings.push({
          tenant_id: tenant.id,
          customer_id: cust.id,
          service_id: svc.id,
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
          status,
          ...(seededRandom(seed++) < 0.5 ? { manage_token: crypto.randomUUID() } : {}),
        })
      }
    }

    // Insert bookings in batches
    for (let i = 0; i < salonBookings.length; i += 500) {
      await supabase.from('bookings').insert(salonBookings.slice(i, i + 500))
    }
    totalSalonBookings += salonBookings.length
  }

  // =============================================
  // CONTACT HISTORY for demo salons
  // =============================================
  const CONTACT_HISTORY_ENTRIES: Array<{
    salonIndex: number
    entries: Array<{ contact_type: string; description: string; days_ago: number }>
  }> = [
    {
      salonIndex: 0, // Bella Nails
      entries: [
        { contact_type: 'call', description: 'Poziv: dogovor o prelasku na godišnji plan. Milena zainteresovana, traži 10% popust.', days_ago: 3 },
        { contact_type: 'email', description: 'Poslat email sa ponudom za godišnji plan i kuponom DOBRODOSLI.', days_ago: 5 },
        { contact_type: 'note', description: 'Beleška: salon ima 3 radna mesta, potencijal za rast. Pratiti mesečne statistike.', days_ago: 15 },
        { contact_type: 'call', description: 'Poziv: tehničko pitanje oko podešavanja radnog vremena za praznike.', days_ago: 25 },
      ],
    },
    {
      salonIndex: 1, // Glamour
      entries: [
        { contact_type: 'meeting', description: 'Online sastanak: prezentacija premium mogućnosti platforme. Zainteresovani za branding.', days_ago: 2 },
        { contact_type: 'email', description: 'Poslat follow-up email nakon demo sastanka sa cenovnikom premium paketa.', days_ago: 4 },
        { contact_type: 'call', description: 'Poziv: pitanje oko integracije sa Instagram-om za automatsko postavljanje slobodnih termina.', days_ago: 12 },
      ],
    },
    {
      salonIndex: 2, // Nails Art NS
      entries: [
        { contact_type: 'call', description: 'Dobrodošlica poziv: uputstva za podešavanje salona i usluga na platformi.', days_ago: 7 },
        { contact_type: 'email', description: 'Poslat vodič za početnike sa uputstvima za korišćenje kalendara i zakazivanja.', days_ago: 10 },
      ],
    },
    {
      salonIndex: 3, // Pink Salon
      entries: [
        { contact_type: 'call', description: 'Poziv: objašnjene mogućnosti platforme. Klijentkinja će probati 14-dnevni trial.', days_ago: 1 },
        { contact_type: 'note', description: 'Beleška: mlada vlasnica (23g), aktivna na TikToku. Potencijal za influencer saradnju.', days_ago: 5 },
      ],
    },
    {
      salonIndex: 4, // Studio M
      entries: [
        { contact_type: 'call', description: 'Mesečni check-in poziv. Sve funkcioniše odlično, zadovoljni platformom.', days_ago: 8 },
        { contact_type: 'email', description: 'Poslat mesečni izveštaj o korišćenju i statistikama salona.', days_ago: 10 },
        { contact_type: 'meeting', description: 'Godišnji pregled saradnje. Dogovoreno produženje na još godinu dana.', days_ago: 30 },
        { contact_type: 'call', description: 'Poziv: predlog za affiliate program - zainteresovani da preporuče platformu kolegama.', days_ago: 45 },
        { contact_type: 'note', description: 'VIP klijent - prioritet za podršku. Uvek odgovoriti u roku od 2h.', days_ago: 60 },
      ],
    },
    {
      salonIndex: 5, // Lux Nails (Problem tag)
      entries: [
        { contact_type: 'call', description: 'Prijava problema: klijenti ne mogu da zakazuju online. Prosleđeno tehničkom timu.', days_ago: 2 },
        { contact_type: 'call', description: 'Follow-up: problem rešen, bio je do podešavanja radnog vremena. Klijent zadovoljan.', days_ago: 1 },
        { contact_type: 'email', description: 'Poslato uputstvo za pravilno podešavanje radnog vremena i pauza.', days_ago: 1 },
        { contact_type: 'note', description: 'Beleška: salon često ima tehničke probleme. Proveriti da li koriste najnoviju verziju booking linka.', days_ago: 5 },
      ],
    },
    {
      salonIndex: 6, // Ana Beauty
      entries: [
        { contact_type: 'email', description: 'Dobrodošlica email sa vodičem za nove korisnike platforme.', days_ago: 3 },
        { contact_type: 'call', description: 'Poziv: pomoć pri dodavanju usluga i podešavanju cena.', days_ago: 5 },
      ],
    },
    {
      salonIndex: 7, // Royal Nails
      entries: [
        { contact_type: 'call', description: 'Razgovor o premium opcijama. Zainteresovani za custom booking stranicu sa brendiranim dizajnom.', days_ago: 10 },
        { contact_type: 'meeting', description: 'Online demo custom booking stranice. Dogovorena implementacija za sledeći mesec.', days_ago: 15 },
        { contact_type: 'note', description: 'Godišnji plan, plaćaju redovno. Predložiti VIP podršku.', days_ago: 30 },
      ],
    },
    {
      salonIndex: 8, // Spa Noktiju (Problem tag)
      entries: [
        { contact_type: 'call', description: 'Poziv: problem sa pretplatom - uplata nije evidentirana. Proveriti sa računovodstvom.', days_ago: 3 },
        { contact_type: 'email', description: 'Poslat zahtev za proveru uplate računovodstvu. Čekamo povratnu informaciju.', days_ago: 4 },
        { contact_type: 'note', description: 'Pretplata istekla, klijent tvrdi da je uplatio. Prioritetno rešiti!', days_ago: 5 },
      ],
    },
    {
      salonIndex: 9, // Moda Nails
      entries: [
        { contact_type: 'call', description: 'Mesečni check-in. Salon dobro koristi platformu, 80+ zakazivanja mesečno.', days_ago: 7 },
        { contact_type: 'email', description: 'Poslat predlog za upgrade na kvartalni plan sa uštedom od 15%.', days_ago: 14 },
      ],
    },
    {
      salonIndex: 10, // Elite Beauty
      entries: [
        { contact_type: 'meeting', description: 'Sastanak u salonu: razgovor o premium pozicioniranju i ekskluzivnim mogućnostima.', days_ago: 5 },
        { contact_type: 'call', description: 'Follow-up poziv: dogovoreni custom branding elementi za booking stranicu.', days_ago: 8 },
        { contact_type: 'email', description: 'Poslat dizajn predlog za custom booking stranicu na odobrenje.', days_ago: 12 },
        { contact_type: 'note', description: 'Salon sa najvišim cenama u Beogradu. Imidž nam je bitan za marketing. Case study kandidat.', days_ago: 20 },
      ],
    },
    {
      salonIndex: 11, // Maja Nails
      entries: [
        { contact_type: 'call', description: 'Dobrodošlica poziv: nova klijentkinja, objasniti funkcionalnosti platforme.', days_ago: 2 },
        { contact_type: 'email', description: 'Poslat vodič za podešavanje salona: usluge, radno vreme, booking link.', days_ago: 3 },
        { contact_type: 'note', description: 'Multi-uslužni salon (nokti + trepavice + obrve). Trebaju im kategorije - feature request.', days_ago: 5 },
      ],
    },
  ]

  const contactsToInsert: Array<{
    tenant_id: string
    contact_type: string
    description: string
    contact_date: string
    created_at: string
  }> = []

  for (const ch of CONTACT_HISTORY_ENTRIES) {
    if (ch.salonIndex >= demoTenants.length) continue
    const tenantId = demoTenants[ch.salonIndex].id
    for (const entry of ch.entries) {
      const contactDate = new Date(now)
      contactDate.setDate(contactDate.getDate() - entry.days_ago)
      contactsToInsert.push({
        tenant_id: tenantId,
        contact_type: entry.contact_type,
        description: entry.description,
        contact_date: contactDate.toISOString(),
        created_at: contactDate.toISOString(),
      })
    }
  }

  if (contactsToInsert.length > 0) {
    await supabase.from('salon_contact_history').insert(contactsToInsert)
    totalContactHistory = contactsToInsert.length
  }

  return {
    salons: demoTenants.length,
    plans: plans.length,
    subscriptions: subscriptionsToInsert.length,
    payments: paymentsToInsert.length,
    finances: adminFinances.length,
    coupons: couponInsertData.length,
    auditEntries: auditEntries.length,
    reminders: remindersToInsert.length,
    tags: totalTagAssignments,
    salonServices: totalSalonServices,
    salonCustomers: totalSalonCustomers,
    salonBookings: totalSalonBookings,
    contactHistory: totalContactHistory,
  }
}
