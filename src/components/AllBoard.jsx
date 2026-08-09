import React, { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import { STATUS_COLUMNS, STATUS_LABELS, formatDate } from '../utils/constants'

export default function AllBoard({ tasks, activities, projects, members, memberName, projectName, taskName, onOpenProject, onOpenTask, refresh, showToast }) {
  const [filterType, setFilterType] = useState('') // '' | 'task' | 'activity'
  const [filterAssignee, setFilterAssignee] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const combinedItems = useMemo(() => {
    // نستثني مهام وأنشطة أي مشروع حالته "مكتمل"
    const visibleTasks = tasks.filter((t) => {
      const proj = projects.find((p) => p.id === t.project_id)
      return proj?.status !== 'done'
    })
    const visibleTaskIds = new Set(visibleTasks.map((t) => t.id))

    const taskItems = visibleTasks.map((t) => ({
      dndId: `task-${t.id}`,
      id: t.id,
      type: 'task',
      name: t.name,
      status: t.status,
      assignee_id: t.assignee_id,
      due_date: t.due_date,
      context: projectName(t.project_id),
    }))
    const activityItems = activities
      .filter((a) => visibleTaskIds.has(a.task_id))
      .map((a) => ({
        dndId: `activity-${a.id}`,
        id: a.id,
        type: 'activity',
        name: a.name,
        status: a.status,
        assignee_id: a.assignee_id,
        due_date: a.due_date,
        context: taskName(a.task_id),
        task_id: a.task_id,
      }))
    let all = [...taskItems, ...activityItems]
    if (filterType) all = all.filter((i) => i.type === filterType)
    if (filterAssignee) all = all.filter((i) => i.assignee_id === filterAssignee)
    return all
  }, [tasks, activities, projects, projectName, taskName, filterType, filterAssignee])

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id
    const item = combinedItems.find((i) => i.dndId === active.id)
    if (!item || item.status === newStatus) return

    const table = item.type === 'task' ? 'tasks' : 'activities'
    const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', item.id)
    if (error) showToast('تعذّر تحديث الحالة')
    else {
      showToast('تم تحديث الحالة')
      refresh()
    }
  }

  function handleOpen(item) {
    if (item.type === 'task') onOpenTask(item.id)
    else onOpenTask(item.task_id)
  }

  return (
    <div>
      <div className="filters-bar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">الكل (مهام وأنشطة)</option>
          <option value="task">مهام فقط</option>
          <option value="activity">أنشطة فقط</option>
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">كل المسؤولين</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {combinedItems.length === 0 ? (
        <div className="empty-state">لا توجد مهام أو أنشطة مطابقة.</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUS_COLUMNS.map((col) => (
              <Column
                key={col.key}
                col={col}
                items={combinedItems.filter((i) => i.status === col.key)}
                memberName={memberName}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}

function Column({ col, items, memberName, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  return (
    <div ref={setNodeRef} className="kanban-column" style={{ background: isOver ? '#E0EFEC' : '#EFEFEF' }}>
      <div className="kanban-column-header">
        <span>{col.label}</span>
        <span>{items.length}</span>
      </div>
      {items.map((item) => (
        <ItemCard key={item.dndId} item={item} memberName={memberName} onOpen={onOpen} />
      ))}
    </div>
  )
}

function ItemCard({ item, memberName, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.dndId })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    borderRightColor: item.type === 'task' ? '#0C7870' : '#68A8C0',
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="badge" style={{ background: item.type === 'task' ? '#0C7870' : '#68A8C0', fontSize: 10 }}>
          {item.type === 'task' ? 'مهمة' : 'نشاط'}
        </span>
      </div>
      <div className="kcard-title">{item.name}</div>
      <div className="kcard-meta">
        <span>{memberName(item.assignee_id)}</span>
        <span>{formatDate(item.due_date)}</span>
      </div>
      <div style={{ fontSize: 11, color: '#68A8C0', marginTop: 4 }}>{item.context}</div>
      <div style={{ marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpen(item)}
        >
          فتح
        </button>
      </div>
    </div>
  )
}
