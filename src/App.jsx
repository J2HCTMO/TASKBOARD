import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProjectsBoard from './components/ProjectsBoard'
import ProjectDetails from './components/ProjectDetails'
import Team from './components/Team'
import SearchResults from './components/SearchResults'
import Reports from './components/Reports'

const PAGE_TITLES = {
  dashboard: 'لوحة المعلومات',
  projects: 'المشاريع',
  team: 'الفريق',
  reports: 'التقارير',
  search: 'نتائج البحث',
  projectDetails: 'تفاصيل المشروع',
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [m, p, t] = await Promise.all([
      supabase.from('members').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
    ])
    if (m.data) setMembers(m.data)
    if (p.data) setProjects(p.data)
    if (t.data) setTasks(t.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    // اشتراك لحظي: أي تغيير من أي عضو يظهر فورًا عند البقية
    const channel = supabase
      .channel('realtime-tahawwul')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  function goToProject(id) {
    setSelectedProjectId(id)
    setPage('projectDetails')
  }

  function runSearch(q) {
    setSearchQuery(q)
    setPage('search')
  }

  function navigate(target) {
    setPage(target)
  }

  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} />
      <div className="main-area">
        <div className="top-header">
          <div className="page-title">{PAGE_TITLES[page]}</div>
          <input
            className="search-input"
            placeholder="ابحث عن مشروع، مهمة، أو عضو..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchInput.trim()) runSearch(searchInput.trim())
            }}
          />
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
                  members={members}
                  memberName={memberName}
                  onBack={() => navigate('projects')}
                  refresh={fetchAll}
                  showToast={showToast}
                />
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
                <Reports projects={projects} tasks={tasks} members={members} memberName={memberName} showToast={showToast} />
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
