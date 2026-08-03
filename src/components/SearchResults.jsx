import React, { useMemo } from 'react'
import { STATUS_LABELS } from '../utils/constants'

export default function SearchResults({ query, projects, tasks, members, memberName, onOpenProject }) {
  const q = query.trim()

  const matchedProjects = useMemo(
    () => projects.filter((p) => p.name.includes(q) || (p.description || '').includes(q)),
    [projects, q]
  )
  const matchedTasks = useMemo(
    () => tasks.filter((t) => t.name.includes(q) || (t.description || '').includes(q)),
    [tasks, q]
  )
  const matchedMembers = useMemo(
    () => members.filter((m) => m.name.includes(q)),
    [members, q]
  )

  const nothingFound = matchedProjects.length === 0 && matchedTasks.length === 0 && matchedMembers.length === 0

  return (
    <div>
      <p style={{ color: '#68A8C0', marginBottom: 20 }}>نتائج البحث عن: «{q}»</p>

      {nothingFound && <div className="empty-state">لا توجد نتائج مطابقة.</div>}

      {matchedProjects.length > 0 && (
        <div className="search-section">
          <h3>المشاريع ({matchedProjects.length})</h3>
          {matchedProjects.map((p) => (
            <div key={p.id} className="search-result-row" onClick={() => onOpenProject(p.id)}>
              {p.name} — <span style={{ color: '#68A8C0' }}>{STATUS_LABELS[p.status]}</span>
            </div>
          ))}
        </div>
      )}

      {matchedTasks.length > 0 && (
        <div className="search-section">
          <h3>المهام ({matchedTasks.length})</h3>
          {matchedTasks.map((t) => (
            <div key={t.id} className="search-result-row" onClick={() => onOpenProject(t.project_id)}>
              {t.name} — <span style={{ color: '#68A8C0' }}>{memberName(t.assignee_id)}</span>
            </div>
          ))}
        </div>
      )}

      {matchedMembers.length > 0 && (
        <div className="search-section">
          <h3>الأعضاء ({matchedMembers.length})</h3>
          {matchedMembers.map((m) => (
            <div key={m.id} className="search-result-row">{m.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}
