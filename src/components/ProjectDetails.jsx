import React, { useMemo, useState } from 'react'
import ProjectModal from './ProjectModal'
import TaskModal from './TaskModal'
import {
  STATUS_COLUMNS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, formatDate, computeProjectProgress,
} from '../utils/constants'

export default function ProjectDetails({ projectId, projects, tasks, members, memberName, onBack, refresh, showToast }) {
  const project = projects.find((p) => p.id === projectId)
  const projectTasks = useMemo(() => tasks.filter((t) => t.project_id === projectId), [tasks, projectId])

  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [taskModal, setTaskModal] = useState('none') // 'none' | null (new) | task
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ assignee: '', status: '', date: '' })

  if (!project) {
    return (
      <div className="empty-state">
        هذا المشروع لم يعد موجودًا.
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onBack}>الرجوع للمشاريع</button>
        </div>
      </div>
    )
  }

  const progress = computeProjectProgress(projectTasks)

  const filteredTasks = projectTasks.filter((t) => {
    if (search && !t.name.includes(search)) return false
    if (filters.assignee && t.assignee_id !== filters.assignee) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.date && t.due_date !== filters.date) return false
    return true
  })

  return (
    <div>
      <div className="breadcrumb">
        <button onClick={onBack}>المشاريع</button> {'>'} {project.name}
      </div>

      <div className="report-preview" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', color: '#083838' }}>{project.name}</h2>
            <p style={{ color: '#68A8C0', margin: '0 0 10px' }}>{project.description || 'لا يوجد وصف'}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
              <span>المالك: <strong>{memberName(project.owner_id)}</strong></span>
              <span className="badge" style={{ background: PRIORITY_COLORS[project.priority] }}>
                {PRIORITY_LABELS[project.priority]}
              </span>
              <span className="badge" style={{ background: STATUS_COLORS[project.status] }}>
                {STATUS_LABELS[project.status]}
              </span>
              <span>البداية: {formatDate(project.start_date)}</span>
              <span>الاستحقاق: {formatDate(project.due_date)}</span>
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <button className="btn btn-secondary" onClick={() => setEditProjectOpen(true)}>تعديل المشروع</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>نسبة الإنجاز (محسوبة تلقائيًا)</span>
            <span><strong>{progress}%</strong></span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, color: '#083838' }}>المهام ({projectTasks.length})</h3>
        <button className="btn btn-primary" onClick={() => setTaskModal(null)}>+ إضافة مهمة</button>
      </div>

      <div className="filters-bar">
        <input className="search-input" placeholder="ابحث داخل المهام..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filters.assignee} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}>
          <option value="">كل المسؤولين</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">كل الحالات</option>
          {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">لا توجد مهام مطابقة — جرّبي إضافة مهمة جديدة أو تعديل الفلاتر.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>اسم المهمة</th>
              <th>المسؤول</th>
              <th>الحالة</th>
              <th>% الإنجاز</th>
              <th>الاستحقاق</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{memberName(t.assignee_id)}</td>
                <td><span className="badge" style={{ background: STATUS_COLORS[t.status] }}>{STATUS_LABELS[t.status]}</span></td>
                <td>{t.progress}%</td>
                <td>{formatDate(t.due_date)}</td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setTaskModal(t)}>
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editProjectOpen && (
        <ProjectModal
          project={project}
          members={members}
          onClose={() => setEditProjectOpen(false)}
          refresh={refresh}
          showToast={showToast}
        />
      )}

      {taskModal !== 'none' && (
        <TaskModal
          task={taskModal}
          projectId={projectId}
          members={members}
          onClose={() => setTaskModal('none')}
          refresh={refresh}
          showToast={showToast}
        />
      )}
    </div>
  )
}
