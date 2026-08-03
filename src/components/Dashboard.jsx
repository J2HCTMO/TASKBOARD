import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, BRAND } from '../utils/constants'

export default function Dashboard({ projects, tasks, members, memberName }) {
  const totalProjects = projects.length
  const doneProjects = projects.filter((p) => p.status === 'done').length
  const inProgressProjects = projects.filter((p) => p.status !== 'done').length
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  const projectsByStatus = useMemo(() => {
    return Object.keys(STATUS_LABELS).map((key) => ({
      name: STATUS_LABELS[key],
      value: projects.filter((p) => p.status === key).length,
      color: STATUS_COLORS[key],
    })).filter((d) => d.value > 0)
  }, [projects])

  const projectsByPriority = useMemo(() => {
    return Object.keys(PRIORITY_LABELS).map((key) => ({
      name: PRIORITY_LABELS[key],
      value: projects.filter((p) => p.priority === key).length,
      color: PRIORITY_COLORS[key],
    })).filter((d) => d.value > 0)
  }, [projects])

  const projectsByMember = useMemo(() => {
    return members.map((m) => ({
      name: m.name,
      عدد: projects.filter((p) => p.owner_id === m.id).length,
    }))
  }, [members, projects])

  const doneTasksByMember = useMemo(() => {
    return members.map((m) => {
      const memberTasks = tasks.filter((t) => t.assignee_id === m.id)
      const done = memberTasks.filter((t) => t.status === 'done').length
      return { name: m.name, 'مهام منجزة': done }
    })
  }, [members, tasks])

  const progressOverTime = useMemo(() => {
    const sorted = [...projects].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    let cumulative = 0
    return sorted.map((p, idx) => {
      if (p.status === 'done') cumulative += 1
      return { name: `مشروع ${idx + 1}`, 'مشاريع مكتملة تراكميًا': cumulative }
    })
  }, [projects])

  if (totalProjects === 0) {
    return (
      <div className="empty-state">
        لا توجد بيانات بعد — ابدئي بإضافة أول مشروع من صفحة "المشاريع".
      </div>
    )
  }

  return (
    <div>
      <div className="stat-cards">
        <StatCard label="إجمالي المشاريع" value={totalProjects} />
        <StatCard label="مشاريع مكتملة" value={doneProjects} />
        <StatCard label="مشاريع قيد التنفيذ" value={inProgressProjects} />
        <StatCard label="إجمالي المهام" value={totalTasks} />
        <StatCard label="مهام مكتملة" value={doneTasks} />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>المشاريع حسب الحالة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={projectsByStatus} dataKey="value" nameKey="name" outerRadius={80} label>
                {projectsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>المشاريع حسب الأولوية</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={projectsByPriority} dataKey="value" nameKey="name" outerRadius={80} label>
                {projectsByPriority.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>توزيع المشاريع على الأعضاء</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectsByMember}>
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="عدد" fill={BRAND.teal} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>المهام المنجزة لكل عضو</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={doneTasksByMember}>
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="مهام منجزة" fill={BRAND.steelBlue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>تقدم المشاريع بمرور الوقت</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progressOverTime}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="مشاريع مكتملة تراكميًا" stroke={BRAND.darkTeal} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}
