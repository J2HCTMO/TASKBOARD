import React, { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import { STATUS_COLUMNS, STATUS_LABELS, formatDate } from '../utils/constants'

export default function AllBoard({ tasks, activities, projects, members, memberName, projectName, taskName, onOpenProject, onOpenTask, refresh, showToast }) {
  const [filterType, setFilterType] = useState('') // '' | 'task' | 'activity'
  const [filterAssignee, setFilterAssignee] = useState('')
  const [showHidden, setShowHidden] = useState(false)

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
      hidden: !!t.hidden,
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
        hidden: !!a.hidden,
      }))
    let all = [...taskItems, ...activityItems]
    if (filterType) all = all.filter((i) => i.type === filterType)
    if (filterAssignee) all = all.filter((i) => i.assignee_id === filterAssignee)
    // بالوضع العادي: نخفي العناصر المخفية. عند تفعيل "عرض المخفية" نعرضها فقط هي
    all = showHidden ? all.filter((i) => i.hidden) : all.filter((i) => !i.hidden)
    return all
  }, [tasks, activities, projects, projectName, taskName, filterType, filterAssignee, showHidden])

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

  async function handleToggleHide(item, hide) {
    const table = item.type === 'task' ? 'tasks' : 'activities'
    const { error } = await supabase.from(table).update({ hidden: hide }).eq('id', item.id)
    if (error) showToast('تعذّر تحديث الإخفاء')
    else {
      showToast(hide ? 'تم إخفاء العنصر من هذي الصفحة' : 'تم إظهار العنصر')
      refresh()
    }
  }

  function handleOpen(item) {
    if (item.type === 'task') onOpenTask(item.id)
    else onOpenTask(item.task_id)
  }

  return (
    <div>
      <div className="filters-bar" style={{ alignItems: 'center' }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">الكل (مهام وأنشطة)</option>
          <option value="task">مهام فقط</option>
          <option value="activity">أنشطة فقط</option>
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">كل المسؤولين</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button
          className="btn btn-secondary"
          onClick={() => setShowHidden((v) => !v)}
          style={{ fontSize: 13 }}
        >
          {showHidden ? '← رجوع للقائمة العادية' : 'عرض العناصر المخفية'}
        </button>
      </div>

      {combinedItems.length === 0 ? (
        <div className="empty-state">
          {showHidden ? 'لا توجد عناصر مخفية حاليًا.' : 'لا توجد مهام أو أنشطة مطابقة.'}
        </div>
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
                onToggleHide={handleToggleHide}
                showHidden={showHidden}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}

function Column({ col, items, memberName, onOpen, onToggleHide, showHidden }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  const isDoneColumn = col.key === 'done'
  return (
    <div ref={setNodeRef} className="kanban-column" style={{ background: isOver ? '#E0EFEC' : '#EFEFEF' }}>
      <div className="kanban-column-header">
        <span>{col.label}</span>
        <span>{items.length}</span>
      </div>
      {items.map((item) => (
        <ItemCard
          key={item.dndId}
          item={item}
          memberName={memberName}
          onOpen={onOpen}
          isDone={isDoneColumn}
          onToggleHide={onToggleHide}
          showHidden={showHidden}
        />
      ))}
    </div>
  )
}

function ItemCard({ item, memberName, onOpen, isDone, onToggleHide, showHidden }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.dndId })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : isDone ? 0.6 : 1,
    zIndex: isDragging ? 10 : 'auto',
    borderRightColor: isDone ? '#94A3B8' : item.type === 'task' ? '#0C7870' : '#68A8C0',
    background: isDone ? '#F5F5F5' : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="badge" style={{ background: item.type === 'task' ? '#0C7870' : '#68A8C0', fontSize: 10 }}>
          {item.type === 'task' ? 'مهمة' : 'نشاط'}
        </span>
        {isDone && !showHidden && (
          <span style={{ color: '#0C7870', fontSize: 13, fontWeight: 700 }}>✓</span>
        )}
      </div>
      <div
        className="kcard-title"
        style={isDone && !showHidden ? { textDecoration: 'line-through', color: '#94A3B8' } : undefined}
      >
        {item.name}
      </div>
      <div className="kcard-meta">
        <span>{memberName(item.assignee_id)}</span>
        <span>{formatDate(item.due_date)}</span>
      </div>
      <div style={{ fontSize: 11, color: '#68A8C0', marginTop: 4 }}>{item.context}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpen(item)}
        >
          فتح
        </button>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggleHide(item, !showHidden)}
          title={showHidden ? 'إظهار العنصر بهذي الصفحة' : 'إخفاء العنصر من هذي الصفحة فقط'}
        >
          {showHidden ? 'إظهار' : 'إخفاء'}
        </button>
      </div>
    </div>
  )
}
