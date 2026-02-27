import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  ArrowLeft, Plus, Download, Trash2, Clock, User,
  ChevronDown, ChevronUp, History, X, Check, Pencil, Users
} from 'lucide-react'

function AuditModal({ task, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('task_audit')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [task.id])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Auditoría</h3>
            <p className="text-sm text-gray-400">{task.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin cambios registrados</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{log.field_changed === 'assignees' ? 'Asignación' : log.field_changed === 'time_start' ? 'Hora inicio' : log.field_changed === 'time_end' ? 'Hora fin' : log.field_changed}</span>
                      {' '}cambió de{' '}
                      <span className="text-gray-500">{log.old_value || '—'}</span>
                      {' '}a{' '}
                      <span className="font-medium text-gray-900">{log.new_value || '—'}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ boardId, onClose, onAdded }) {
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ board_id: boardId, description: description.trim() })
      .select()
      .single()
    if (!error) {
      onAdded(data)
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Nueva tarea</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la tarea</label>
            <input
              ref={inputRef}
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="¿Qué se va a hacer?"
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!description.trim() || saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Plus size={15} />
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskRow({ task, onUpdate, onDelete, collaborators }) {
  const [assignedIds, setAssignedIds] = useState([])
  const [timeStart, setTimeStart] = useState(task.time_start || '')
  const [timeEnd, setTimeEnd] = useState(task.time_end || '')
  const [auditOpen, setAuditOpen] = useState(false)
  const [showAssignPicker, setShowAssignPicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    // Cargar asignaciones
    fetchAssignments()
  }, [task.id])

  useEffect(() => {
    // Cerrar picker al hacer clic fuera
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowAssignPicker(false)
      }
    }
    if (showAssignPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAssignPicker])

  async function fetchAssignments() {
    const { data } = await supabase
      .from('task_assignments')
      .select('collaborator_id')
      .eq('task_id', task.id)
    setAssignedIds((data || []).map(a => a.collaborator_id))
  }

  async function toggleAssignment(collaboratorId) {
    const isAssigned = assignedIds.includes(collaboratorId)
    
    if (isAssigned) {
      // Remover asignación
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', task.id)
        .eq('collaborator_id', collaboratorId)
      
      const oldNames = assignedIds.map(id => collaborators.find(c => c.id === id)?.name).filter(Boolean).join(', ')
      const newNames = assignedIds.filter(id => id !== collaboratorId).map(id => collaborators.find(c => c.id === id)?.name).filter(Boolean).join(', ')
      
      await supabase.from('task_audit').insert({
        task_id: task.id,
        field_changed: 'assignees',
        old_value: oldNames || null,
        new_value: newNames || null,
      })
      
      setAssignedIds(prev => prev.filter(id => id !== collaboratorId))
    } else {
      // Agregar asignación
      await supabase
        .from('task_assignments')
        .insert({ task_id: task.id, collaborator_id: collaboratorId })
      
      const oldNames = assignedIds.map(id => collaborators.find(c => c.id === id)?.name).filter(Boolean).join(', ')
      const newNames = [...assignedIds, collaboratorId].map(id => collaborators.find(c => c.id === id)?.name).filter(Boolean).join(', ')
      
      await supabase.from('task_audit').insert({
        task_id: task.id,
        field_changed: 'assignees',
        old_value: oldNames || null,
        new_value: newNames || null,
      })
      
      setAssignedIds(prev => [...prev, collaboratorId])
    }
    onUpdate({ ...task })
  }

  async function updateTime(field, newValue) {
    const oldValue = field === 'time_start' ? timeStart : timeEnd
    if (newValue === oldValue) return

    const updates = { [field]: newValue || null }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    await supabase.from('task_audit').insert({
      task_id: task.id,
      field_changed: field,
      old_value: oldValue || null,
      new_value: newValue || null,
    })

    if (field === 'time_start') setTimeStart(newValue)
    else setTimeEnd(newValue)
    onUpdate({ ...task, ...updates })
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('task_assignments').delete().eq('task_id', task.id)
    await supabase.from('task_audit').delete().eq('task_id', task.id)
    await supabase.from('tasks').delete().eq('id', task.id)
    onDelete(task.id)
  }

  const assignedCollaborators = collaborators.filter(c => assignedIds.includes(c.id))

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-2 sm:px-4 py-3">
          <div className="text-sm text-gray-800">{task.description}</div>
          
          {/* Assignees - Mobile view */}
          <div className="flex flex-wrap gap-1 mt-2">
            {assignedCollaborators.map(c => (
              <span key={c.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {c.name}
              </span>
            ))}
            <div className="relative inline-block" ref={pickerRef}>
              <button
                onClick={() => setShowAssignPicker(!showAssignPicker)}
                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full transition-colors"
                title="Asignar colaboradores"
              >
                <Users size={12} />
                <Plus size={12} />
              </button>
              
              {showAssignPicker && (
                <div className="fixed inset-0 bg-black/20 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Asignar colaboradores</h3>
                      <button
                        onClick={() => setShowAssignPicker(false)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {collaborators.map(collab => {
                        const isAssigned = assignedIds.includes(collab.id)
                        return (
                          <label
                            key={collab.id}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => toggleAssignment(collab.id)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                                {collab.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-800 font-medium">{collab.name}</span>
                            </div>
                          </label>
                        )
                      })}
                      {collaborators.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No hay colaboradores</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Time button - Mobile only */}
            <button
              onClick={() => setShowTimePicker(true)}
              className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full transition-colors sm:hidden"
              title="Establecer horario"
            >
              <Clock size={12} />
              {(timeStart || timeEnd) && <span>{timeStart || '—'} - {timeEnd || '—'}</span>}
            </button>
          </div>
        </td>

        {/* Time range - Desktop only */}
        <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={timeStart}
              onChange={e => updateTime('time_start', e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
            />
            <span className="text-gray-400 text-xs">a</span>
            <input
              type="time"
              value={timeEnd}
              onChange={e => updateTime('time_end', e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
            />
          </div>
        </td>

        {/* Actions */}
        <td className="px-2 sm:px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setShowTimePicker(true)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors sm:hidden"
              title="Horario"
            >
              <Clock size={18} />
            </button>
            <button
              onClick={() => setAuditOpen(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver auditoría"
            >
              <History size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>

      {/* Time Picker Modal - Mobile */}
      {showTimePicker && (
        <tr>
          <td colSpan={2}>
            <div className="fixed inset-0 bg-black/20 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Establecer horario</h3>
                  <button
                    onClick={() => setShowTimePicker(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={timeStart}
                      onChange={e => updateTime('time_start', e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={e => updateTime('time_end', e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowTimePicker(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {auditOpen && (
        <AuditModal task={task} onClose={() => setAuditOpen(false)} />
      )}
    </>
  )
}

export default function Board() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetchBoard()
    fetchCollaborators()
  }, [id])

  async function fetchCollaborators() {
    const { data } = await supabase
      .from('collaborators')
      .select('*')
      .eq('active', true)
      .order('name')
    setCollaborators(data || [])
  }

  async function fetchBoard() {
    const [{ data: boardData }, { data: tasksData }] = await Promise.all([
      supabase.from('task_boards').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('board_id', id).order('created_at'),
    ])
    setBoard(boardData)
    setTasks(tasksData || [])
    setLoading(false)
  }

  function handleTaskAdded(task) {
    setTasks(prev => [...prev, task])
  }

  function handleTaskUpdate(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  function handleTaskDelete(taskId) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function exportToExcel() {
    // Obtener todas las asignaciones
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, collaborator_id')
      .in('task_id', tasks.map(t => t.id))

    const rows = tasks.map((t, i) => {
      const taskAssignments = assignments?.filter(a => a.task_id === t.id) || []
      const assignedNames = taskAssignments
        .map(a => collaborators.find(c => c.id === a.collaborator_id)?.name)
        .filter(Boolean)
        .join(', ')

      return {
        '#': i + 1,
        'Tarea': t.description,
        'Asignado a': assignedNames || '—',
        'Hora inicio': t.time_start || '',
        'Hora fin': t.time_end || '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tareas')
    XLSX.writeFile(wb, `${board?.title || 'tareas'}.xlsx`)
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
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{board?.title}</h1>
              <p className="text-xs text-gray-400">{tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={exportToExcel}
              disabled={tasks.length === 0}
              className="hidden sm:flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Download size={15} />
              <span className="hidden md:inline">Exportar Excel</span>
            </button>
            <button
              onClick={exportToExcel}
              disabled={tasks.length === 0}
              className="sm:hidden p-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded-lg transition-colors disabled:opacity-40"
              title="Exportar Excel"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} />
              Agregar tarea
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="sm:hidden p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Agregar tarea"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 mb-4">
              <Plus size={64} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No hay tareas aún</p>
            <p className="text-gray-400 text-sm mt-1">Agrega la primera tarea del día</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Agregar tarea
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tarea
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell w-52">
                    Horario
                  </th>
                  <th className="px-2 sm:px-4 py-3 w-16 sm:w-20"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    collaborators={collaborators}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAdd && (
        <AddTaskModal
          boardId={id}
          onClose={() => setShowAdd(false)}
          onAdded={handleTaskAdded}
        />
      )}
    </div>
  )
}
