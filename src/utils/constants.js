لة تحول" البصرية
export const BRAND = {
  navy: '#001830',
  teal: '#0C7870',
  darkTeal: '#083838',
  steelBlue: '#68A8C0',
  lightBg: '#F8F8F8',
  mint: '#88D0C8',
}
 
export const STATUS_COLUMNS = [
  { key: 'todo', label: 'قيد الانتظار' },
  { key: 'build', label: 'قيد التنفيذ' },
  { key: 'test', label: 'قيد المراجعة' },
  { key: 'done', label: 'مكتمل' },
]
 
export const STATUS_LABELS = STATUS_COLUMNS.reduce((acc, s) => {
  acc[s.key] = s.label
  return acc
}, {})
 
export const STATUS_COLORS = {
  todo: '#94A3B8',
  build: BRAND.steelBlue,
  test: '#D9A441',
  done: BRAND.teal,
}
 
export const PRIORITY_OPTIONS = [
  { key: 'high', label: 'عالية', color: '#D64545' },
  { key: 'medium', label: 'متوسطة', color: '#D9A441' },
  { key: 'low', label: 'منخفضة', color: BRAND.teal },
]
 
export const PRIORITY_LABELS = PRIORITY_OPTIONS.reduce((acc, p) => {
  acc[p.key] = p.label
  return acc
}, {})
 
export const PRIORITY_COLORS = PRIORITY_OPTIONS.reduce((acc, p) => {
  acc[p.key] = p.color
  return acc
}, {})
 
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
 
// نسبة إنجاز المشروع = عدد المهام المكتملة / إجمالي المهام
export function computeProjectProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}
 
// نسبة إنجاز المهمة من أنشطتها (إن وجدت) = عدد الأنشطة المكتملة / إجمالي الأنشطة
export function computeTaskProgressFromActivities(activities) {
  if (!activities || activities.length === 0) return null
  const done = activities.filter((a) => a.status === 'done').length
  return Math.round((done / activities.length) * 100)
}
 
// نسبة إنجاز فعلية للمهمة: من الأنشطة إن وجدت، وإلا القيمة اليدوية المخزّنة
export function effectiveTaskProgress(task, allActivities) {
  const taskActivities = (allActivities || []).filter((a) => a.task_id === task.id)
  const fromActivities = computeTaskProgressFromActivities(taskActivities)
  return fromActivities !== null ? fromActivities : task.progress
}
