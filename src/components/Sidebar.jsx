import React from 'react'

const ITEMS = [
  { key: 'dashboard', label: 'لوحة المعلومات', icon: '🏠' },
  { key: 'projects', label: 'المشاريع', icon: '📋' },
  { key: 'allBoard', label: 'كل المهام والأنشطة', icon: '🗂️' },
  { key: 'calendar', label: 'التقويم', icon: '📅' },
  { key: 'team', label: 'الفريق', icon: '👥' },
  { key: 'reports', label: 'التقارير', icon: '📄' },
]

export default function Sidebar({ page, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-cluster.png" alt="تجمع جدة الصحي الثاني" className="sidebar-logo-img" />
        <span>لوحة مشاريع/مهام إدارة التحول</span>
      </div>
      {ITEMS.map((item) => (
        <button
          key={item.key}
          className={`sidebar-item ${page === item.key || (page === 'projectDetails' && item.key === 'projects') ? 'active' : ''}`}
          onClick={() => onNavigate(item.key)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
