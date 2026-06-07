import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="layout-main">
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
