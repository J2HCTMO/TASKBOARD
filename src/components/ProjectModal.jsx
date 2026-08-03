import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PRIORITY_OPTIONS } from '../utils/constants'

export default function ProjectModal({ project, members, onClose, refresh, showToast }) {
  const isEdit = !!project
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    owner_id: project?.owner_id || (members[0]?.id ?? ''),
    priority: project?.priority || 'medium',
    start_date: project?.start_date || '',
    due_date: project?.due_date || '',
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast('اسم المشروع مطلوب')
      return
    }
    setSaving(true)
    if (isEdit) {
      const { error } = await supabase.from('projects').update(form).eq('id', project.id)
      if (error) showToast('حدث خطأ أثناء الحفظ')
      else showToast('تم تحديث المشروع')
    } else {
      const { error } = await supabase.from('projects').insert([{ ...form, status: 'todo' }])
      if (error) showToast('حدث خطأ أثناء الإضافة')
      else showToast('تمت إضافة المشروع')
    }
    setSaving(false)
    refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكدة من حذف هذا المشروع؟ سيتم حذف كل مهامه أيضًا.')) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) showToast('حدث خطأ أثناء الحذف')
    else showToast('تم حذف المشروع')
    refresh()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'تعديل المشروع' : 'مشروع جديد'}</h2>

        <div className="form-group">
          <label>اسم المشروع</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label>مالك المشروع</label>
          <select value={form.owner_id} onChange={(e) => update('owner_id', e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>الأولوية</label>
          <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
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

        <div className="modal-actions">
          <div>
            {isEdit && <button className="btn btn-danger" onClick={handleDelete}>حذف المشروع</button>}
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
