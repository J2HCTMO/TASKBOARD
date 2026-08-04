import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { STATUS_COLUMNS } from '../utils/constants'

export default function TaskModal({ task, projectId, members, onClose, refresh, showToast }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    name: task?.name || '',
    description: task?.description || '',
    assignee_id: task?.assignee_id || (members[0]?.id ?? ''),
    status: task?.status || 'todo',
    start_date: task?.start_date || '',
    due_date: task?.due_date || '',
    notes: task?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast('اسم المهمة مطلوب')
      return
    }
    setSaving(true)
    // نسبة الإنجاز تُشتق تلقائيًا من الحالة: 100% عند الاكتمال، وإلا 0%
    // (تُستبدل تلقائيًا بنسبة الأنشطة إن وُجدت أنشطة لهذه المهمة)
    const payload = { ...form, progress: form.status === 'done' ? 100 : 0 }
    if (isEdit) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', task.id)
      if (error) showToast('حدث خطأ أثناء الحفظ')
      else showToast('تم تحديث المهمة')
    } else {
      const { error } = await supabase.from('tasks').insert([{ ...payload, project_id: projectId }])
      if (error) showToast('حدث خطأ أثناء الإضافة')
      else showToast('تمت إضافة المهمة')
    }
    setSaving(false)
    refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكدة من حذف هذه المهمة؟')) return
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) showToast('حدث خطأ أثناء الحذف')
    else showToast('تم حذف المهمة')
    refresh()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'تعديل المهمة' : 'مهمة جديدة'}</h2>

        <div className="form-group">
          <label>اسم المهمة</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label>المسؤول</label>
          <select value={form.assignee_id} onChange={(e) => update('assignee_id', e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>الحالة</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {STATUS_COLUMNS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>تاريخ البداية</label>
          <input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} />
        </div>

        <div className="form-group">
          <label>تاريخ الاستحقاق</label>
          <input type="date" value={form.due_date || ''} onChange={(e) => update('due_date', e.target.value)} />
        </div>

        <div className="form-group">
          <label>ملاحظات</label>
          <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>

        <div className="modal-actions">
          <div>
            {isEdit && <button className="btn btn-danger" onClick={handleDelete}>حذف المهمة</button>}
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
