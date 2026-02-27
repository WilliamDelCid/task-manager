-- ============================================
-- TASK MANAGER - Schema para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de colaboradores
CREATE TABLE collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla principal: listados del día
CREATE TABLE task_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tareas
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES task_boards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  time_start TIME,
  time_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignaciones (relación muchos a muchos)
CREATE TABLE task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, collaborator_id)
);

-- Tabla de auditoría
CREATE TABLE task_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_task_audit_task_id ON task_audit(task_id);
CREATE INDEX idx_task_boards_date ON task_boards(date);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_collaborator_id ON task_assignments(collaborator_id);

-- ============================================
-- Políticas RLS (Row Level Security)
-- Acceso público sin autenticación
-- ============================================
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit ENABLE ROW LEVEL SECURITY;


-- Por si las policies no se crearon
DROP POLICY IF EXISTS "Public access" ON task_assignments;
DROP POLICY IF EXISTS "Public access" ON collaborators;
DROP POLICY IF EXISTS "Public access" ON task_boards;
DROP POLICY IF EXISTS "Public access" ON tasks;
DROP POLICY IF EXISTS "Public access" ON task_audit;


CREATE POLICY "Public access" ON task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON task_boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON task_audit FOR ALL USING (true) WITH CHECK (true);