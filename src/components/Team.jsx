import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { STATUS_LABELS } from '../utils/constants'

export default function Team({ members, projects, tasks, refresh, showToast }) {
  const [expanded, setExpanded] = useState({}) // { [memberId]: 'owned' | 'assigned' | 'doneProjects' | 'doneTasks' | null }
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

  function toggle(memberId, category) {
    setExpanded((prev) => ({
      ...prev,
      [memberId]: prev[memberId] === category ? null : category,
    }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>+ إضافة عضو</button>
      </div>

      <div className="member-grid">
        {members.map((m) => {
          const ownedProjects = projects.filter((p) => p.owner_id === m.id)
          const doneProjects = ownedProjects.filter((p) => p.status === 'done')
          const assignedTasks = tasks.filter((t) => t.assignee_id === m.id)
          const doneTasks = assignedTasks.filter((t) => t.status === 'done')

          const activeCategory = expanded[m.id]
          const listsByCategory = {
            owned: { label: 'المشاريع المملوكة', items: ownedProjects },
            assigned: { label: 'المهام المسندة', items: assignedTasks },
            doneProjects: { label: 'المشاريع المنجزة', items: doneProjects },
            doneTasks: { label: 'المهام المنجزة', items: doneTasks },
          }
          const activeList = activeCategory ? listsByCategory[activeCategory] : null

          return (
            <div key={m.id} className="member-card">
              <div className="member-name">{m.name}</div>

              <StatRow
                label="مشاريع مملوكة"
                value={ownedProjects.length}
                active={activeCategory === 'owned'}
                onClick={() => toggle(m.id, 'owned')}
              />
              <StatRow
                label="مهام مسندة"
                value={assignedTasks.length}
                active={activeCategory === 'assigned'}
                onClick={() => toggle(m.id, 'assigned')}
              />
              <StatRow
                label="مشاريع منجزة"
                value={doneProjects.length}
                active={activeCategory === 'doneProjects'}
                onClick={() => toggle(m.id, 'doneProjects')}
              />
              <StatRow
                label="مهام منجزة"
                value={doneTasks.length}
                active={activeCategory === 'doneTasks'}
                onClick={() => toggle(m.id, 'doneTasks')}
              />

              {activeList && (
                <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#0C7870' }}>
                    {activeList.label}:
                  </div>
                  {activeList.items.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#999' }}>لا توجد عناصر</div>
                  ) : (
                    activeList.items.map((item) => (
                      <div key={item.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {item.name}</span>
                        <span style={{ color: '#68A8C0' }}>{STATUS_LABELS[item.status]}</span>
                      </div>
                    ))
                  )}
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

function StatRow({ label, value, active, onClick }) {
  return (
    <div
      className="member-stat-row"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '6px 8px',
        borderRadius: 6,
        background: active ? '#E0EFEC' : 'transparent',
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
