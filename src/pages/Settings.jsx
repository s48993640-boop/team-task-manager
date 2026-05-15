import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Save, User, Shield } from 'lucide-react'

export default function Settings() {
  const { user, profile, isAdmin } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSaveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', user.id)
    if (!error) {
      setMessage('Name updated successfully')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    const form = e.target
    const newPassword = form.newPassword.value
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully')
      form.reset()
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-navy-400 mt-1">Manage your account</p>
      </div>

      {message && (
        <div className="bg-accent-500/10 border border-accent-500/30 text-accent-400 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-navy-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-400">
            <Shield size={14} />
            <span>Role: <span className="capitalize text-white">{profile?.role}</span></span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">New Password</label>
            <input
              name="newPassword"
              type="password"
              minLength={6}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
              placeholder="Min. 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-700 hover:bg-navy-600 text-white font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
