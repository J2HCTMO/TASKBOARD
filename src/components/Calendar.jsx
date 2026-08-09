import React, { useEffect, useMemo, useState } from 'react'
import EventModal from './EventModal'
import { fetchGoogleCalendarEvents } from '../utils/googleCalendar'

const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Calendar({ events, members, memberName, refresh, showToast }) {
  const [cursor, setCursor] = useState(new Date())
  const [googleEvents, setGoogleEvents] = useState([])
  const [eventModal, setEventModal] = useState('none') // 'none' | {date} for new | event object for edit
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    fetchGoogleCalendarEvents().then(setGoogleEvents)
  }, [])

  const allEvents = useMemo(() => [...events, ...googleEvents], [events, googleEvents])

  const eventsByDate = useMemo(() => {
    const map = {}
    allEvents.forEach((ev) => {
      if (!map[ev.event_date]) map[ev.event_date] = []
      map[ev.event_date].push(ev)
    })
    return map
  }, [allEvents])

  // تذكيرات: مواعيد اليوم أو غدًا مع تفعيل التذكير
  const upcomingReminders = useMemo(() => {
    const todayKey = toDateKey(new Date())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = toDateKey(tomorrow)
    return events.filter(
      (e) => e.reminder_enabled && (e.event_date === todayKey || e.event_date === tomorrowKey)
    )
  }, [events])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = firstDayOfMonth.getDay() // 0=Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function goPrevMonth() {
    setCursor(new Date(year, month - 1, 1))
  }
  function goNextMonth() {
    setCursor(new Date(year, month + 1, 1))
  }
  function goToday() {
    setCursor(new Date())
  }

  function openDayEvents(dateKey) {
    setSelectedDay(dateKey)
  }

  const todayKey = toDateKey(new Date())

  return (
    <div>
      {upcomingReminders.length > 0 && (
        <div style={{ background: '#FFF4E0', border: '1px solid #D9A441', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <strong style={{ color: '#083838' }}>🔔 تذكيرات قريبة:</strong>
          <ul style={{ margin: '8px 0 0', paddingRight: 20 }}>
            {upcomingReminders.map((e) => (
              <li key={e.id} style={{ fontSize: 13, color: '#083838' }}>
                {e.title} — {e.event_date === todayKey ? 'اليوم' : 'غدًا'} {e.start_time ? `الساعة ${e.start_time}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={goPrevMonth}>‹ السابق</button>
          <button className="btn btn-secondary" onClick={goToday}>اليوم</button>
          <button className="btn btn-secondary" onClick={goNextMonth}>التالي ›</button>
        </div>
        <h2 style={{ margin: 0, color: '#083838' }}>{MONTH_NAMES[month]} {year}</h2>
        <button className="btn btn-primary" onClick={() => setEventModal({ date: todayKey })}>+ موعد جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#68A8C0', padding: 6, minWidth: 0 }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} style={{ minWidth: 0 }} />
          const dateObj = new Date(year, month, d)
          const dateKey = toDateKey(dateObj)
          const dayEvents = eventsByDate[dateKey] || []
          const isToday = dateKey === todayKey
          return (
            <div
              key={idx}
              onClick={() => openDayEvents(dateKey)}
              style={{
                minHeight: 90,
                minWidth: 0,
                overflow: 'hidden',
                background: isToday ? '#E0EFEC' : '#fff',
                border: isToday ? '2px solid #0C7870' : '1px solid #eee',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#083838' }}>{d}</div>
              {dayEvents.slice(0, 2).map((ev) => {
                const isConsult = ev.source === 'google' && ev.title.includes('استفسار')
                const bg = isConsult ? '#D9A441' : ev.source === 'google' ? '#68A8C0' : '#0C7870'
                return (
                  <div
                    key={ev.id}
                    style={{
                      fontSize: 10,
                      background: bg,
                      color: '#fff',
                      borderRadius: 4,
                      padding: '2px 4px',
                      marginTop: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {ev.title}
                  </div>
                )
              })}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: 10, color: '#68A8C0', marginTop: 2 }}>+{dayEvents.length - 2} أخرى</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#68A8C0', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#0C7870', borderRadius: 3, marginLeft: 4 }} /> مواعيد المنصة</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#68A8C0', borderRadius: 3, marginLeft: 4 }} /> مواعيد قوقل (حجوزات)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#D9A441', borderRadius: 3, marginLeft: 4 }} /> حجز موعد استفسار</span>
      </div>

      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>مواعيد {selectedDay}</h2>
            {(eventsByDate[selectedDay] || []).length === 0 ? (
              <div className="empty-state">لا توجد مواعيد بهذا اليوم.</div>
            ) : (
              (eventsByDate[selectedDay] || []).map((ev) => (
                <div key={ev.id} className="search-result-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => {
                    if (ev.source !== 'google') {
                      setEventModal(ev)
                      setSelectedDay(null)
                    }
                  }}
                >
                  <div>
                    <strong>{ev.title}</strong>
                    {ev.start_time && <span style={{ color: '#68A8C0', fontSize: 12 }}> — {ev.start_time}</span>}
                    {ev.source === 'google' && (
                      <span className="badge" style={{ background: ev.title.includes('استفسار') ? '#D9A441' : '#68A8C0', marginRight: 8, fontSize: 10 }}>
                        {ev.title.includes('استفسار') ? 'استفسار' : 'قوقل'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div className="modal-actions">
              <div />
              <div className="modal-actions-right">
                <button className="btn btn-primary" onClick={() => { setEventModal({ date: selectedDay }); setSelectedDay(null) }}>+ إضافة موعد</button>
                <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventModal !== 'none' && (
        <EventModal
          event={eventModal?.date ? null : eventModal}
          defaultDate={eventModal?.date}
          members={members}
          onClose={() => setEventModal('none')}
          refresh={refresh}
          showToast={showToast}
        />
      )}
    </div>
  )
}
