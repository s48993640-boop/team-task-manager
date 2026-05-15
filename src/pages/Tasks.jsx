import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-navy-700 text-navy-300' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-warning-500/15 text-warning-500' },
  { value: 'completed', label: 'Completed', color: 'bg-success-500/15 text-success-500' },
]

export default function Tasks() {
  const { isAdmin, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', priority: 'medium', project_id: '', assigned_to: '', due_date: '' })
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [tasksRes, projectsRes, membersRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(name), profiles:assigned_to(full_name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
      supabase.from('profiles').select('id, full_name, role'),
    ])
    setTasks(tasksRes.data || [])
    setProjects(projectsRes.data || [])
    setMembers(membersRes.data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ title: '', description: '', status: 'pending', priority: 'medium', project_id: '', assigned_to: '', due_date: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(task) {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Task title is required'); return }
    if (!form.project_id) { setError('Please select a project'); return }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      project_id: form.project_id,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    }

    if (editing) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('tasks').insert({ ...payload, created_by: user.id })
      if (error) { setError(error.message); return }
    }
    setShowModal(false)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    loadData()
  }

  async function changeStatus(task, newStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    loadData()
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterProject !== 'all' && t.project_id !== filterProject) return false
    return true
  })

  const priorityColors = {
    high: 'text-error-500',
    medium: 'text-warning-500',
    low: 'text-success-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-navy-400 mt-1">{filtered.length} tasks</p>
        </div>
        <button onClick={openCreate} className="bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(task => {
          const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status)
          const isOverdue = task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()
          return (
            <div key={task.id} className="bg-navy-900 border border-navy-700 rounded-xl p-4 hover:border-navy-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-white font-medium truncate">{task.title}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusOpt?.color}`}>
                      {statusOpt?.label}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[task.priority] || 'text-navy-400'}`}>
                      {task.priority?.toUpperCase()}
                    </span>
                    {isOverdue && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-error-500/15 text-error-500 font-medium">Overdue</span>
                    )}
                  </div>
                  <p className="text-navy-400 text-sm truncate">{task.description || 'No description'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-navy-500">
                    <span>{task.projects?.name || 'No project'}</span>
                    <span>Assignee: {task.profiles?.full_name || 'Unassigned'}</span>
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => changeStatus(task, task.status === 'pending' ? 'in-progress' : 'completed')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition-colors"
                    >
                      {task.status === 'pending' ? 'Start' : 'Complete'}
                    </button>
                  )}
                  <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-navy-400 hover:text-accent-400 hover:bg-navy-800 transition-colors text-xs">Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg text-navy-400 hover:text-error-400 hover:bg-navy-800 transition-colors text-xs">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-navy-400">No tasks found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-navy-900 border border-navy-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-navy-400 hover:text-white"><X size={18} /></button>
            </div>
            {error && (
              <div className="bg-error-500/10 border border-error-500/30 text-error-400 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 resize-none"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Project</label>
                  <select
                    value={form.project_id}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Assignee</label>
                  <select
                    value={form.assigned_to}
                    onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-200 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">
                {editing ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
