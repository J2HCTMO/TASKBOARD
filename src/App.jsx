import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectsBoard from './components/ProjectsBoard'
import ProjectDetails from './components/ProjectDetails'
import TaskDetails from './components/TaskDetails'
import AllBoard from './components/AllBoard'
import Calendar from './components/Calendar'
import Team from './components/Team'
import SearchResults from './components/SearchResults'
import Reports from './components/Reports'
import Login from './components/Login'

const PAGE_TITLES = {
  dashboard: 'لوحة المعلومات',
  projects: 'المشاريع',
  team: 'الفريق',
  reports: 'التقارير',
  search: 'نتائج البحث',
  projectDetails: 'تفاصيل المشروع',
  taskDetails: 'تفاصيل المهمة',
  allBoard: 'كل المهام والأنشطة',
  calendar: 'التقويم',
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('tahawwul_auth') === 'true')

  const [page, setPage] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [reportProjectId, setReportProjectId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [m, p, t, a, ev] = await Promise.all([
      supabase.from('members').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('activities').select('*').order('created_at'),
      supabase.from('events').select('*').order('event_date'),
    ])
    if (m.data) setMembers(m.data)
    if (p.data) setProjects(p.data)
    if (t.data) setTasks(t.data)
    if (a.data) setActivities(a.data)
    if (ev.data) setEvents(ev.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchAll()

    const channel = supabase
      .channel('realtime-tahawwul')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll, authed])

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  function goToProject(id) {
    setSelectedProjectId(id)
    setPage('projectDetails')
  }

  function goToTask(id) {
    setSelectedTaskId(id)
    setPage('taskDetails')
  }

  function runSearch(q) {
    setSearchQuery(q)
    setPage('search')
  }

  function goToProjectReport(id) {
    setReportProjectId(id)
    setPage('reports')
  }

  function navigate(target) {
    if (target === 'reports') setReportProjectId(null)
    setPage(target)
  }

  function logout() {
    localStorage.removeItem('tahawwul_auth')
    setAuthed(false)
  }

  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'
  const projectName = (id) => projects.find((p) => p.id === id)?.name || '—'
  const taskName = (id) => tasks.find((t) => t.id === id)?.name || '—'

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} />
      <div className="main-area">
        <div className="top-header">
          <div className="page-title">{PAGE_TITLES[page]}</div>
          <div className="header-search-group">
            <img src="/logo-rihlat-tahawwul.png" alt="رحلة تحوّل" className="header-logo-img" />
            <input
              className="search-input"
              placeholder="ابحث عن مشروع، مهمة، أو عضو..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim()) runSearch(searchInput.trim())
              }}
            />
            <button
              onClick={logout}
              title="تسجيل الخروج"
              style={{
                marginRight: 10,
                background: 'transparent',
                border: '1px solid #68A8C0',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                color: '#083838',
                cursor: 'pointer',
              }}
            >
              خروج
            </button>
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div className="empty-state">جاري تحميل البيانات...</div>
          ) : (
            <>
              {page === 'dashboard' && (
                <Dashboard projects={projects} tasks={tasks} members={members} memberName={memberName} />
              )}
              {page === 'projects' && (
                <ProjectsBoard
                  projects={projects}
                  tasks={tasks}
                  members={members}
                  memberName={memberName}
                  onOpenProject={goToProject}
                  refresh={fetchAll}
                  showToast={showToast}
                />
              )}
              {page === 'projectDetails' && (
                <ProjectDetails
                  projectId={selectedProjectId}
                  projects={projects}
                  tasks={tasks}
                  activities={activities}
                  members={members}
                  memberName={memberName}
                  onBack={() => navigate('projects')}
                  refresh={fetchAll}
                  showToast={showToast}
                  onExportReport={goToProjectReport}
                  onOpenTask={goToTask}
                />
              )}
              {page === 'taskDetails' && (
                <TaskDetails
                  taskId={selectedTaskId}
                  tasks={tasks}
                  projects={projects}
                  activities={activities}
                  members={members}
                  memberName={memberName}
                  onBack={() => goToProject(tasks.find((t) => t.id === selectedTaskId)?.project_id)}
                  refresh={fetchAll}
                  showToast={showToast}
                />
              )}
              {page === 'allBoard' && (
                <AllBoard
                  tasks={tasks}
                  activities={activities}
                  projects={projects}
                  members={members}
                  memberName={memberName}
                  projectName={projectName}
                  taskName={taskName}
                  onOpenProject={goToProject}
                  onOpenTask={goToTask}
                  refresh={fetchAll}
                  showToast={showToast}
                />
              )}
              {page === 'calendar' && (
                <Calendar events={events} members={members} memberName={memberName} refresh={fetchAll} showToast={showToast} />
              )}
              {page === 'team' && (
                <Team members={members} projects={projects} tasks={tasks} refresh={fetchAll} showToast={showToast} />
              )}
              {page === 'search' && (
                <SearchResults
                  query={searchQuery}
                  projects={projects}
                  tasks={tasks}
                  members={members}
                  memberName={memberName}
                  onOpenProject={goToProject}
                />
              )}
              {page === 'reports' && (
                <Reports projects={projects} tasks={tasks} members={members} memberName={memberName} showToast={showToast} initialProjectId={reportProjectId} />
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
