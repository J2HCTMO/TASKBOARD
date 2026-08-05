// جلب أحداث تقويم قوقل (للقراءة فقط) عبر Google Calendar API
// يحتاج: تقويم عام (Public) + مفتاح API + معرّف التقويم
// تُقرأ القيم من متغيرات البيئة في Vercel

const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY

export async function fetchGoogleCalendarEvents() {
  if (!CALENDAR_ID || !API_KEY) {
    // الربط مع قوقل غير مفعّل بعد (لم تُضاف المفاتيح) — نتجاهل بصمت
    return []
  }

  const timeMin = new Date()
  timeMin.setMonth(timeMin.getMonth() - 1)
  const timeMax = new Date()
  timeMax.setMonth(timeMax.getMonth() + 3)

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    CALENDAR_ID
  )}/events?key=${API_KEY}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=250`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map((ev) => {
      const startRaw = ev.start?.dateTime || ev.start?.date
      const dateOnly = startRaw ? startRaw.slice(0, 10) : null
      const startTime = ev.start?.dateTime ? ev.start.dateTime.slice(11, 16) : null
      return {
        id: `google-${ev.id}`,
        title: ev.summary || 'موعد بدون عنوان',
        description: ev.description || '',
        event_date: dateOnly,
        start_time: startTime,
        source: 'google',
        htmlLink: ev.htmlLink,
      }
    }).filter((ev) => ev.event_date)
  } catch (e) {
    console.error('Google Calendar fetch error:', e)
    return []
  }
}
