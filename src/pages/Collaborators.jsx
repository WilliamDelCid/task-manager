import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Mail, User } from 'lucide-react'

function CollaboratorModal({ collaborator, onClose, onSaved }) {
  const [name, setName] = useState(collaborator?.name || '')
  const [email, setEmail] = useState(collaborator?.email || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    
    setSaving(true)
    if (collaborator) {
      // Editar
      const { error } = await supabase
        .from('collaborators')
        .update({ name: name.trim(), email: email.trim() || null })
        .eq('id', collaborator.id)
      if (!error) onSaved()
    } else {
      // Crear
      const { error } = await supabase
        .from('collaborators')
        .insert({ name: name.trim(), email: email.trim() || null })
      if (!error) onSaved()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">
            {collaborator ? 'Editar colaborador' : 'Nuevo colaborador'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Check size={15} />
              {collaborator ? 'Guardar cambios' : 'Crear colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Collaborators() {
  const navigate = useNavigate()
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState(null)

  useEffect(() => {
    fetchCollaborators()
  }, [])

  async function fetchCollaborators() {
    const { data } = await supabase
      .from('collaborators')
      .select('*')
      .eq('active', true)
      .order('name')
    setCollaborators(data || [])
    setLoading(false)
  }

  function handleAdd() {
    setEditingCollaborator(null)
    setShowModal(true)
  }

  function handleEdit(collaborator) {
    setEditingCollaborator(collaborator)
    setShowModal(true)
  }

  async function handleDelete(collaborator) {
    if (!confirm(`¿Eliminar a ${collaborator.name}?`)) return
    
    // Marcar como inactivo en lugar de eliminar
    await supabase
      .from('collaborators')
      .update({ active: false })
      .eq('id', collaborator.id)
    
    fetchCollaborators()
  }

  function handleModalClose() {
    setShowModal(false)
    setEditingCollaborator(null)
  }

  function handleSaved() {
    handleModalClose()
    fetchCollaborators()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Colaboradores</h1>
              <p className="text-xs text-gray-400">
                {collaborators.length} {collaborators.length === 1 ? 'colaborador' : 'colaboradores'}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Agregar colaborador
          </button>
          <button
            onClick={handleAdd}
            className="sm:hidden p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Agregar colaborador"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {collaborators.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 mb-4">
              <User size={64} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No hay colaboradores</p>
            <p className="text-gray-400 text-sm mt-1">Agrega el primer colaborador</p>
            <button
              onClick={handleAdd}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Agregar colaborador
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Correo electrónico
                  </th>
                  <th className="px-3 sm:px-4 py-3 w-16 sm:w-24"></th>
                </tr>
              </thead>
              <tbody>
                {collaborators.map(collaborator => (
                  <tr
                    key={collaborator.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-800 block">
                            {collaborator.name}
                          </span>
                          <span className="text-xs text-gray-500 sm:hidden block truncate">
                            {collaborator.email || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">
                        {collaborator.email || '—'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(collaborator)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(collaborator)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <CollaboratorModal
          collaborator={editingCollaborator}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
