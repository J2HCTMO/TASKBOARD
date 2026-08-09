import React, { useState, useMemo } from 'react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import ProjectModal from './ProjectModal'
import { STATUS_COLUMNS, PRIORITY_COLORS, PRIORITY_LABELS, formatDate } from '../utils/constants'

export default function ProjectsBoard({ projects, members, memberName, onOpenProject, refresh, showToast }) {
  const [modalProject, setModalProject] = useState('none') // 'none' | null (new) | project object
  const [filters, setFilters] = useState({ owner: '', priority: '', date: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filters.owner && p.owner_id !== filters.owner) return false
      if (filters.priority && p.priority !== filters.priority) return false
      if (filters.date && p.due_date !== filters.date) return false
      return true
    })
  }, [projects, filters])

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id
    const project = projects.find((p) => p.id === active.id)
    if (!project || project.status === newStatus) return
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', project.id)
    if (error) showToast('تعذّر تحديث الحالة')
    else {
      showToast('تم تحديث حالة المشروع')
      refresh()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div />
        <button className="btn btn-primary" onClick={() => setModalProject(null)}>+ مشروع جديد</button>
      </div>

      <div className="filters-bar">
        <select value={filters.owner} onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value }))}>
          <option value="">كل الملّاك</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">كل الأولويات</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
        {(filters.owner || filters.priority || filters.date) && (
          <button className="btn btn-secondary" onClick={() => setFilters({ owner: '', priority: '', date: '' })}>
            إزالة الفلاتر
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">لا توجد مشاريع بعد — ابدئي بإضافة أول مشروع.</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUS_COLUMNS.map((col) => (
              <Column
                key={col.key}
                col={col}
                projects={filtered.filter((p) =>
                  p.status === col.key || (col.key === 'build' && p.status === 'test')
                )}
                memberName={memberName}
                onOpenProject={onOpenProject}
                onEdit={setModalProject}
              />
            ))}
          </div>
        </DndContext>
      )}

      {modalProject !== 'none' && (
        <ProjectModal
          project={modalProject}
          members={members}
          onClose={() => setModalProject('none')}
          refresh={refresh}
          showToast={showToast}
        />
      )}
    </div>
  )
}

function Column({ col, projects, memberName, onOpenProject, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  return (
    <div ref={setNodeRef} className="kanban-column" style={{ background: isOver ? '#E0EFEC' : '#EFEFEF' }}>
      <div className="kanban-column-header">
        <span>{col.label}</span>
        <span>{projects.length}</span>
      </div>
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} memberName={memberName} onOpenProject={onOpenProject} onEdit={onEdit} />
      ))}
    </div>
  )
}

function ProjectCard({ project, memberName, onOpenProject, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    borderRightColor: PRIORITY_COLORS[project.priority],
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div className="kcard-title">{project.name}</div>
      <div className="kcard-meta">
        <span>{memberName(project.owner_id)}</span>
        <span>{formatDate(project.due_date)}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpenProject(project.id)}
        >
          فتح
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(project)}
        >
          تعديل
        </button>
      </div>
    </div>
  )
}
