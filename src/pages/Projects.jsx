import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

export default function Projects() {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, profiles:created_by(full_name)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(project) {
    setEditing(project)
    setForm({ name: project.name, description: project.description || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Project name is required'); return }

    if (editing) {
      const { error } = await supabase
        .from('projects')
        .update({ name: form.name.trim(), description: form.description.trim() })
        .eq('id', editing.id)
      if (error) { setError(error.message); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('projects')
        .insert({ name: form.name.trim(), description: form.description.trim(), created_by: user.id })
      if (error) { setError(error.message); return }
    }
    setShowModal(false)
    loadProjects()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its tasks?')) return
    await supabase.from('tasks').delete().eq('project_id', id)
    await supabase.from('projects').delete().eq('id', id)
    loadProjects()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-navy-400 mt-1">{projects.length} projects</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-navy-900 border border-navy-700 rounded-xl p-5 hover:border-navy-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">{project.name}</h3>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg text-navy-400 hover:text-accent-400 hover:bg-navy-800 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-lg text-navy-400 hover:text-error-400 hover:bg-navy-800 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-navy-400 text-sm line-clamp-2">{project.description || 'No description'}</p>
            <div className="mt-4 pt-3 border-t border-navy-700/50 flex items-center justify-between">
              <span className="text-xs text-navy-500">Owner: {project.profiles?.full_name || 'Unknown'}</span>
              <span className="text-xs text-navy-500">{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 text-navy-400">
            No projects yet. {isAdmin && 'Create one to get started!'}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-navy-900 border border-navy-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-navy-400 hover:text-white"><X size={18} /></button>
            </div>
            {error && (
              <div className="bg-error-500/10 border border-error-500/30 text-error-400 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 resize-none"
                  placeholder="Brief description"
                />
              </div>
              <button type="submit" className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">
                {editing ? 'Update Project' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
