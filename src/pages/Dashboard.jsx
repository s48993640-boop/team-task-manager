import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SquareCheck as CheckSquare, Clock, TriangleAlert as AlertTriangle, TrendingUp, FolderKanban } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#f59e0b', '#00b1a3', '#22c55e']

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, projects: 0 })
  const [statusData, setStatusData] = useState([])
  const [projectData, setProjectData] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const [tasksRes, projectsRes, recentRes] = await Promise.all([
      supabase.from('tasks').select('status, due_date, project_id'),
      supabase.from('projects').select('id, name'),
      supabase.from('tasks').select('id, title, status, due_date, projects(name)').order('created_at', { ascending: false }).limit(5),
    ])

    const tasks = tasksRes.data || []
    const projects = projectsRes.data || []
    const recent = recentRes.data || []

    const now = new Date()
    const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now)
    const completed = tasks.filter(t => t.status === 'completed')
    const inProgress = tasks.filter(t => t.status === 'in-progress')
    const pending = tasks.filter(t => t.status === 'pending')

    setStats({
      total: tasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      overdue: overdue.length,
      projects: projects.length,
    })

    setStatusData([
      { name: 'Pending', value: pending.length },
      { name: 'In Progress', value: inProgress.length },
      { name: 'Completed', value: completed.length },
    ])

    const tasksByProject = projects.map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      tasks: tasks.filter(t => t.project_id === p.id).length,
      completed: tasks.filter(t => t.project_id === p.id && t.status === 'completed').length,
    }))
    setProjectData(tasksByProject)
    setRecentTasks(recent)
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'text-success-500', bg: 'bg-success-500/10' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-warning-500', bg: 'bg-warning-500/10' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-error-500', bg: 'bg-error-500/10' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-navy-400 mt-1">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-navy-900 border border-navy-700 rounded-xl p-5 hover:border-navy-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-navy-400">{label}</span>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1f36', border: '1px solid #162f52', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-navy-300">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Project</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: '#7e99bd', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7e99bd', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1f36', border: '1px solid #162f52', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="tasks" fill="#00b1a3" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
          <a href="/tasks" className="text-sm text-accent-400 hover:text-accent-300">View all</a>
        </div>
        <div className="space-y-3">
          {recentTasks.length === 0 && (
            <p className="text-navy-400 text-sm py-4 text-center">No tasks yet</p>
          )}
          {recentTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between py-3 border-b border-navy-700/50 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{task.title}</p>
                <p className="text-navy-400 text-xs mt-0.5">{task.projects?.name || 'No project'}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                task.status === 'completed' ? 'bg-success-500/15 text-success-500' :
                task.status === 'in-progress' ? 'bg-warning-500/15 text-warning-500' :
                'bg-navy-700 text-navy-300'
              }`}>
                {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
