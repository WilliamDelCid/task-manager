import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ASSIGNEES } from '../lib/assignees'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  ArrowLeft, Plus, Download, Trash2, Clock, User,
  ChevronDown, ChevronUp, History, X, Check, Pencil
} from 'lucide-react'

const AUTHOR_OPTIONS = ASSIGNEES

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
                      <span className="font-medium">{log.field_changed === 'assignee' ? 'Asignación' : log.field_changed === 'time_start' ? 'Hora inicio' : log.field_changed === 'time_end' ? 'Hora fin' : log.field_changed}</span>
                      {' '}cambió de{' '}
                      <span className="text-gray-500">{log.old_value || '—'}</span>
                      {' '}a{' '}
                      <span className="font-medium text-gray-900">{log.new_value || '—'}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.changed_by && `Por ${log.changed_by} · `}
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Nueva tarea</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la tarea</label>
            <input
              ref={inputRef}
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="¿Qué se va a hacer?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!description.trim() || saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
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

function TaskRow({ task, onUpdate, onDelete }) {
  const [assignee, setAssignee] = useState(task.assignee || '')
  const [timeStart, setTimeStart] = useState(task.time_start || '')
  const [timeEnd, setTimeEnd] = useState(task.time_end || '')
  const [auditOpen, setAuditOpen] = useState(false)
  const [changedBy, setChangedBy] = useState('')
  const [showChangedBy, setShowChangedBy] = useState(false)
  const [pendingField, setPendingField] = useState(null)
  const [pendingValue, setPendingValue] = useState(null)

  function requestChange(field, newValue, oldValue) {
    if (newValue === oldValue) return
    setPendingField(field)
    setPendingValue({ field, newValue, oldValue })
    setShowChangedBy(true)
  }

  async function confirmChange() {
    const { field, newValue, oldValue } = pendingValue
    const updates = {}
    if (field === 'assignee') { updates.assignee = newValue; setAssignee(newValue) }
    if (field === 'time_start') { updates.time_start = newValue; setTimeStart(newValue) }
    if (field === 'time_end') { updates.time_end = newValue; setTimeEnd(newValue) }

    await supabase.from('tasks').update(updates).eq('id', task.id)
    await supabase.from('task_audit').insert({
      task_id: task.id,
      field_changed: field,
      old_value: oldValue || null,
      new_value: newValue || null,
      changed_by: changedBy || null,
    })

    onUpdate({ ...task, ...updates })
    setShowChangedBy(false)
    setPendingField(null)
    setChangedBy('')
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('task_audit').delete().eq('task_id', task.id)
    await supabase.from('tasks').delete().eq('id', task.id)
    onDelete(task.id)
  }

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-800">{task.description}</td>

        {/* Assignee */}
        <td className="px-4 py-3">
          <select
            value={assignee}
            onChange={e => requestChange('assignee', e.target.value, assignee)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">— Sin asignar —</option>
            {ASSIGNEES.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </td>

        {/* Time range */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={timeStart}
              onChange={e => requestChange('time_start', e.target.value, timeStart)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            />
            <span className="text-gray-400 text-xs">a</span>
            <input
              type="time"
              value={timeEnd}
              onChange={e => requestChange('time_end', e.target.value, timeEnd)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            />
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAuditOpen(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver auditoría"
            >
              <History size={15} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>

      {/* Who made the change */}
      {showChangedBy && (
        <tr>
          <td colSpan={4} className="px-4 py-2 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-700">¿Quién realizó este cambio?</span>
              <select
                value={changedBy}
                onChange={e => setChangedBy(e.target.value)}
                className="text-sm border border-amber-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Selecciona...</option>
                {ASSIGNEES.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
              <button
                onClick={confirmChange}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                <Check size={14} />
                Confirmar
              </button>
              <button
                onClick={() => { setShowChangedBy(false); setPendingField(null) }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
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
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetchBoard()
  }, [id])

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

  function exportToExcel() {
    const rows = tasks.map((t, i) => ({
      '#': i + 1,
      'Tarea': t.description,
      'Asignado a': t.assignee || '',
      'Hora inicio': t.time_start || '',
      'Hora fin': t.time_end || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 25 }, { wch: 15 }, { wch: 15 }]
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{board?.title}</h1>
              <p className="text-xs text-gray-400">{tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={tasks.length === 0}
              className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Download size={15} />
              Exportar Excel
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} />
              Agregar tarea
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarea</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-52">Asignado a</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">Rango de tiempo</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
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
