import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Team({ members, projects, tasks, refresh, showToast }) {
  const [expanded, setExpanded] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleAddMember() {
    if (!newName.trim()) return
    const { error } = await supabase.from('members').insert([{ name: newName.trim() }])
    if (error) showToast('حدث خطأ أثناء الإضافة')
    else showToast('تمت إضافة العضو')
    setNewName('')
    setAddOpen(false)
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ إضافة عضو</button>
      </div>

      <div className="member-grid">
        {members.map((m) => {
          const ownedProjects = projects.filter((p) => p.owner_id === m.id)
          const assignedTasks = tasks.filter((t) => t.assignee_id === m.id)
          const doneTasks = assignedTasks.filter((t) => t.status === 'done')
          const pct = assignedTasks.length ? Math.round((doneTasks.length / assignedTasks.length) * 100) : 0
          const isOpen = expanded === m.id

          return (
            <div key={m.id} className="member-card" onClick={() => setExpanded(isOpen ? null : m.id)}>
              <div className="member-name">{m.name}</div>
              <div className="member-stat-row"><span>مشاريع مملوكة</span><strong>{ownedProjects.length}</strong></div>
              <div className="member-stat-row"><span>مهام مسندة</span><strong>{assignedTasks.length}</strong></div>
              <div className="member-stat-row"><span>مهام منجزة</span><strong>{doneTasks.length}</strong></div>
              <div className="member-stat-row"><span>نسبة الإنجاز</span><strong>{pct}%</strong></div>
              <div className="progress-bar-track" style={{ marginTop: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>

              {isOpen && (
                <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>المشاريع:</div>
                  {ownedProjects.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#999' }}>لا توجد مشاريع</div>
                  ) : ownedProjects.map((p) => (
                    <div key={p.id} style={{ fontSize: 12, marginBottom: 3 }}>• {p.name}</div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>إضافة عضو جديد</h2>
            <div className="form-group">
              <label>الاسم</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
            <div className="modal-actions">
              <div />
              <div className="modal-actions-right">
                <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleAddMember}>حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
