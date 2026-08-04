import React, { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { exportElementToPDF } from '../utils/pdfExport'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate, BRAND } from '../utils/constants'

export default function Reports({ projects, tasks, members, memberName, showToast, initialProjectId }) {
  const [scope, setScope] = useState(initialProjectId ? 'project' : 'team') // 'team' | 'member' | 'project'
  const [memberId, setMemberId] = useState(members[0]?.id || '')
  const [projectId, setProjectId] = useState(initialProjectId || projects[0]?.id || '')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (initialProjectId) {
      setScope('project')
      setProjectId(initialProjectId)
    }
  }, [initialProjectId])

  const scopedProjects = useMemo(() => {
    if (scope === 'team') return projects
    if (scope === 'project') return projects.filter((p) => p.id === projectId)
    return projects.filter((p) => p.owner_id === memberId)
  }, [scope, memberId, projectId, projects])

  const scopedTasks = useMemo(() => {
    if (scope === 'team') return tasks
    if (scope === 'project') return tasks.filter((t) => t.project_id === projectId)
    return tasks.filter((t) => t.assignee_id === memberId)
  }, [scope, memberId, projectId, tasks])

  const statusData = useMemo(() => {
    return Object.keys(STATUS_LABELS).map((key) => ({
      name: STATUS_LABELS[key],
      value: scopedTasks.filter((t) => t.status === key).length,
      color: STATUS_COLORS[key],
    })).filter((d) => d.value > 0)
  }, [scopedTasks])

  const priorityData = useMemo(() => {
    return Object.keys(PRIORITY_LABELS).map((key) => ({
      name: PRIORITY_LABELS[key],
      value: scopedProjects.filter((p) => p.priority === key).length,
      color: PRIORITY_COLORS[key],
    })).filter((d) => d.value > 0)
  }, [scopedProjects])

  async function handleExport() {
    setExporting(true)
    const label = scope === 'team'
      ? 'الفريق-كامل'
      : scope === 'project'
        ? (projects.find((p) => p.id === projectId)?.name || 'مشروع')
        : memberName(memberId)
    try {
      await exportElementToPDF('pdf-report-content', `تقرير-${label}.pdf`)
      showToast('تم تصدير التقرير')
    } catch (e) {
      showToast('حدث خطأ أثناء التصدير')
    }
    setExporting(false)
  }

  return (
    <div>
      <div className="filters-bar" style={{ alignItems: 'center' }}>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="team">الفريق كاملًا</option>
          <option value="member">عضو محدد</option>
          <option value="project">مشروع محدد</option>
        </select>
        {scope === 'member' && (
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        {scope === 'project' && (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button className="btn btn-primary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'جاري التصدير...' : '⬇ تصدير PDF'}
        </button>
      </div>

      <div className="report-preview">
        <div id="pdf-report-content">
          <h1>تقرير رحلة تحوّل</h1>
          <p>النطاق: {scope === 'team' ? 'الفريق كاملًا' : scope === 'project' ? (projects.find((p) => p.id === projectId)?.name || '—') : memberName(memberId)}</p>
          <p style={{ color: '#68A8C0', fontSize: 13 }}>تاريخ الإصدار: {formatDate(new Date().toISOString())}</p>

          <div style={{ display: 'flex', gap: 20, margin: '20px 0' }}>
            <MiniStat label="عدد المشاريع" value={scopedProjects.length} />
            <MiniStat label="عدد المهام" value={scopedTasks.length} />
            <MiniStat label="مهام مكتملة" value={scopedTasks.filter((t) => t.status === 'done').length} />
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 320, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: 320, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={BRAND.teal} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 style={{ color: '#083838' }}>قائمة المشاريع</h3>
          <table className="data-table">
            <thead>
              <tr><th>المشروع</th><th>المالك</th><th>الحالة</th><th>الأولوية</th></tr>
            </thead>
            <tbody>
              {scopedProjects.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{memberName(p.owner_id)}</td>
                  <td>{STATUS_LABELS[p.status]}</td>
                  <td>{PRIORITY_LABELS[p.priority]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ color: '#083838', marginTop: 20 }}>قائمة المهام</h3>
          <table className="data-table">
            <thead>
              <tr><th>المهمة</th><th>المسؤول</th><th>الحالة</th><th>% الإنجاز</th></tr>
            </thead>
            <tbody>
              {scopedTasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{memberName(t.assignee_id)}</td>
                  <td>{STATUS_LABELS[t.status]}</td>
                  <td>{t.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: '#F8F8F8', borderRadius: 10, padding: '12px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#001830' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#68A8C0' }}>{label}</div>
    </div>
  )
}
