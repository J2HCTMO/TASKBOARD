import React, { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import ProjectModal from './ProjectModal'
import TaskModal from './TaskModal'
import {
  STATUS_COLUMNS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, formatDate, computeProjectProgress, effectiveTaskProgress,
} from '../utils/constants'

export default function ProjectDetails({ projectId, projects, tasks, activities, members, memberName, onBack, refresh, showToast, onExportReport, onOpenTask }) {
  const project = projects.find((p) => p.id === projectId)
  const projectTasks = useMemo(() => tasks.filter((t) => t.project_id === projectId), [tasks, projectId])

  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [taskModal, setTaskModal] = useState('none') // 'none' | null (new) | task
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ assignee: '', date: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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
    if (filters.date && t.due_date !== filters.date) return false
    return true
  })

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id
    const task = projectTasks.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) showToast('تعذّر تحديث الحالة')
    else {
      showToast('تم تحديث حالة المهمة')
      refresh()
    }
  }

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
          <div style={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setEditProjectOpen(true)}>تعديل المشروع</button>
            <button className="btn btn-primary" onClick={() => onExportReport(project.id)}>تصدير تقرير</button>
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
        <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">لا توجد مهام مطابقة — جرّبي إضافة مهمة جديدة أو تعديل الفلاتر.</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUS_COLUMNS.map((col) => (
              <Column
                key={col.key}
                col={col}
                items={filteredTasks.filter((t) => t.status === col.key)}
                activities={activities}
                memberName={memberName}
                onOpenTask={onOpenTask}
                onEdit={setTaskModal}
              />
            ))}
          </div>
        </DndContext>
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

function Column({ col, items, activities, memberName, onOpenTask, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  return (
    <div ref={setNodeRef} className="kanban-column" style={{ background: isOver ? '#E0EFEC' : '#EFEFEF' }}>
      <div className="kanban-column-header">
        <span>{col.label}</span>
        <span>{items.length}</span>
      </div>
      {items.map((t) => (
        <TaskCard key={t.id} task={t} activities={activities} memberName={memberName} onOpenTask={onOpenTask} onEdit={onEdit} />
      ))}
    </div>
  )
}

function TaskCard({ task, activities, memberName, onOpenTask, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }
  const activitiesCount = activities.filter((a) => a.task_id === task.id).length
  const progress = effectiveTaskProgress(task, activities)

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div className="kcard-title">{task.name}</div>
      <div className="kcard-meta">
        <span>{memberName(task.assignee_id)}</span>
        <span>{formatDate(task.due_date)}</span>
      </div>
      <div style={{ fontSize: 11, color: '#68A8C0', marginTop: 4 }}>
        {activitiesCount} نشاط · {progress}%
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpenTask(task.id)}
        >
          الأنشطة
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(task)}
        >
          تعديل
        </button>
      </div>
    </div>
  )
}
