import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function EventModal({ event, defaultDate, members, onClose, refresh, showToast }) {
  const isEdit = !!event
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || defaultDate || '',
    start_time: event?.start_time || '',
    end_time: event?.end_time || '',
    assignee_id: event?.assignee_id || '',
    reminder_enabled: event?.reminder_enabled || false,
    reminder_minutes_before: event?.reminder_minutes_before ?? 30,
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) {
      showToast('عنوان الموعد مطلوب')
      return
    }
    if (!form.event_date) {
      showToast('التاريخ مطلوب')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      assignee_id: form.assignee_id || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    }
    if (isEdit) {
      const { error } = await supabase.from('events').update(payload).eq('id', event.id)
      if (error) showToast('حدث خطأ أثناء الحفظ')
      else showToast('تم تحديث الموعد')
    } else {
      const { error } = await supabase.from('events').insert([payload])
      if (error) showToast('حدث خطأ أثناء الإضافة')
      else showToast('تمت إضافة الموعد')
    }
    setSaving(false)
    refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكدة من حذف هذا الموعد؟')) return
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) showToast('حدث خطأ أثناء الحذف')
    else showToast('تم حذف الموعد')
    refresh()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'تعديل الموعد' : 'موعد جديد'}</h2>

        <div className="form-group">
          <label>العنوان</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} />
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label>التاريخ</label>
          <input type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>وقت البداية</label>
            <input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>وقت النهاية</label>
            <input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>مرتبط بعضو (اختياري)</label>
          <select value={form.assignee_id} onChange={(e) => update('assignee_id', e.target.value)}>
            <option value="">بدون تحديد</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.reminder_enabled}
              onChange={(e) => update('reminder_enabled', e.target.checked)}
              style={{ width: 'auto' }}
            />
            تفعيل تذكير داخل المنصة
          </label>
        </div>

        {form.reminder_enabled && (
          <div className="form-group">
            <label>التذكير قبل (بالدقائق)</label>
            <input
              type="number"
              min={5}
              value={form.reminder_minutes_before}
              onChange={(e) => update('reminder_minutes_before', Number(e.target.value))}
            />
          </div>
        )}

        <div className="modal-actions">
          <div>
            {isEdit && <button className="btn btn-danger" onClick={handleDelete}>حذف الموعد</button>}
          </div>
          <div className="modal-actions-right">
            <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
