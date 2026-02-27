import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ClipboardList, ChevronRight, Calendar } from 'lucide-react'

export default function Home() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBoards()
  }, [])

  async function fetchBoards() {
    const { data } = await supabase
      .from('task_boards')
      .select('*, tasks(count)')
      .order('created_at', { ascending: false })
    setBoards(data || [])
    setLoading(false)
  }

  async function createTodayBoard() {
    setCreating(true)
    const today = new Date().toISOString().split('T')[0]

    // Check if today's board already exists
    const { data: existing } = await supabase
      .from('task_boards')
      .select('id')
      .eq('date', today)
      .single()

    if (existing) {
      navigate(`/board/${existing.id}`)
      return
    }

    const title = `Listado del ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}`
    const { data, error } = await supabase
      .from('task_boards')
      .insert({ title, date: today })
      .select()
      .single()

    if (!error) navigate(`/board/${data.id}`)
    setCreating(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const todayBoard = boards.find(b => b.date === todayStr)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <ClipboardList className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-xs text-gray-500">Gestión de tareas diarias</p>
            </div>
          </div>
          <button
            onClick={createTodayBoard}
            disabled={creating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Plus size={16} />
            {todayBoard ? 'Abrir listado de hoy' : 'Crear listado de hoy'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No hay listados aún</p>
            <p className="text-gray-400 text-sm mt-1">Crea el listado de hoy para empezar</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Listados</h2>
            {boards.map(board => {
              const isToday = board.date === todayStr
              const taskCount = board.tasks?.[0]?.count ?? 0
              return (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-2 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <Calendar size={18} className={isToday ? 'text-blue-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{board.title}</p>
                        {isToday && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Hoy</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
