import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Shield, User, Mail } from 'lucide-react'

export default function Team() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [roleForm, setRoleForm] = useState('')

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: true })
    setMembers(data || [])
    setLoading(false)
  }

  async function updateRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setMembers(m => m.map(m => m.id === userId ? { ...m, role: newRole } : m))
    }
    setEditing(null)
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
      <div>
        <h1 className="text-2xl font-bold text-white">Team Members</h1>
        <p className="text-navy-400 mt-1">{members.length} members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map(member => (
          <div key={member.id} className="bg-navy-900 border border-navy-700 rounded-xl p-5 hover:border-navy-600 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent-500/15 flex items-center justify-center text-accent-400 font-bold text-lg">
                {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
              </div>
              <div>
                <h3 className="text-white font-semibold">{member.full_name}</h3>
                <p className="text-navy-400 text-sm">Joined {new Date(member.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-navy-400" />
                <span className="text-navy-300">Role:</span>
                {editing === member.id ? (
                  <select
                    value={roleForm}
                    onChange={e => setRoleForm(e.target.value)}
                    onBlur={() => updateRole(member.id, roleForm)}
                    onKeyDown={e => e.key === 'Enter' && updateRole(member.id, roleForm)}
                    className="bg-navy-800 border border-navy-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                    autoFocus
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    member.role === 'admin' ? 'bg-accent-500/15 text-accent-400' : 'bg-navy-700 text-navy-300'
                  }`}>
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                )}
                {isAdmin && editing !== member.id && (
                  <button
                    onClick={() => { setEditing(member.id); setRoleForm(member.role) }}
                    className="text-xs text-navy-500 hover:text-accent-400 ml-1"
                  >
                    edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-navy-400">No team members found</div>
        )}
      </div>
    </div>
  )
}
