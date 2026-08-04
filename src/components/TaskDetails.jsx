import React, { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import TaskModal from './TaskModal'
import ActivityModal from './ActivityModal'
import {
  STATUS_COLUMNS, STATUS_LABELS, STATUS_COLORS, formatDate,
  computeTaskProgressFromActivities,
} from '../utils/constants'

export default function TaskDetails({ taskId, tasks, projects, activities, members, memberName, onBack, refresh, showToast }) {
  const task = tasks.find((t) => t.id === taskId)
  const project = task ? projects.find((p) => p.id === task.project_id) : null
  const taskActivities = useMemo(() => activities.filter((a) => a.task_id === taskId), [activities, taskId])

  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [activityModal, setActivityModal] = useState('none') // 'none' | null (new) | activity

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!task) {
    return (
      <div className="empty-state">
        هذه المهمة لم تعد موجودة.
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onBack}>الرجوع</button>
        </div>
      </div>
    )
  }

  const computedProgress = computeTaskProgressFromActivities(taskActivities)
  const displayedProgress = computedProgress !== null ? computedProgress : task.progress

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id
    const activity = taskActivities.find((a) => a.id === active.id)
    if (!activity || activity.status === newStatus) return
    const { error } = await supabase.from('activities').update({ status: newStatus }).eq('id', activity.id)
    if (error) showToast('تعذّر تحديث الحالة')
    else {
      showToast('تم تحديث حالة النشاط')
      refresh()
    }
  }

  return (
    <div>
      <div className="breadcrumb">
        <button onClick={onBack}>{project?.name || 'المشروع'}</button> {'>'} {task.name}
      </div>

      <div className="report-preview" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', color: '#083838' }}>{task.name}</h2>
            <p style={{ color: '#68A8C0', margin: '0 0 10px' }}>{task.description || 'لا يوجد وصف'}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
              <span>المسؤول: <strong>{memberName(task.assignee_id)}</strong></span>
              <span className="badge" style={{ background: STATUS_COLORS[task.status] }}>
                {STATUS_LABELS[task.status]}
              </span>
              <span>الاستحقاق: {formatDate(task.due_date)}</span>
            </div>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={() => setEditTaskOpen(true)}>تعديل المهمة</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>نسبة الإنجاز {computedProgress !== null ? '(محسوبة من الأنشطة)' : '(يدوية)'}</span>
            <span><strong>{displayedProgress}%</strong></span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${displayedProgress}%` }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, color: '#083838' }}>الأنشطة ({taskActivities.length})</h3>
        <button className="btn btn-primary" onClick={() => setActivityModal(null)}>+ إضافة نشاط</button>
      </div>

      {taskActivities.length === 0 ? (
        <div className="empty-state">لا توجد أنشطة بعد — أضيفي أول نشاط لهذه المهمة.</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUS_COLUMNS.map((col) => (
              <Column
                key={col.key}
                col={col}
                items={taskActivities.filter((a) => a.status === col.key)}
                memberName={memberName}
                onEdit={setActivityModal}
              />
            ))}
          </div>
        </DndContext>
      )}

      {editTaskOpen && (
        <TaskModal
          task={task}
          projectId={task.project_id}
          members={members}
          onClose={() => setEditTaskOpen(false)}
          refresh={refresh}
          showToast={showToast}
        />
      )}

      {activityModal !== 'none' && (
        <ActivityModal
          activity={activityModal}
          taskId={taskId}
          members={members}
          onClose={() => setActivityModal('none')}
          refresh={refresh}
          showToast={showToast}
        />
      )}
    </div>
  )
}

function Column({ col, items, memberName, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  return (
    <div ref={setNodeRef} className="kanban-column" style={{ background: isOver ? '#E0EFEC' : '#EFEFEF' }}>
      <div className="kanban-column-header">
        <span>{col.label}</span>
        <span>{items.length}</span>
      </div>
      {items.map((a) => (
        <ActivityCard key={a.id} activity={a} memberName={memberName} onEdit={onEdit} />
      ))}
    </div>
  )
}

function ActivityCard({ activity, memberName, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: activity.id })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div className="kcard-title">{activity.name}</div>
      <div className="kcard-meta">
        <span>{memberName(activity.assignee_id)}</span>
        <span>{formatDate(activity.due_date)}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(activity)}
        >
          تعديل
        </button>
      </div>
    </div>
  )
}
