# Guía de Migración - Task Manager

## Cambios Implementados

### 1. Nueva tabla de Colaboradores
- Se creó la tabla `collaborators` para gestionar colaboradores desde la base de datos
- Los colaboradores se pueden agregar, editar y eliminar desde la interfaz

### 2. Asignación Múltiple
- Ahora una tarea puede ser asignada a múltiples colaboradores
- Se creó la tabla `task_assignments` para la relación muchos-a-muchos
- Se eliminó el campo `assignee` de la tabla `tasks`

### 3. Auditoría Simplificada
- Se eliminó el campo `changed_by` de la tabla `task_audit`
- Los cambios se registran automáticamente sin solicitar quién lo realizó

### 4. Exportación Excel Mejorada
- El Excel ahora muestra todos los colaboradores asignados a cada tarea
- Formato: "Colaborador 1, Colaborador 2, Colaborador 3"

## Instrucciones de Migración

### Opción 1: Base de Datos Nueva (Recomendado)

Si estás empezando o no tienes datos importantes:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a `SQL Editor`
3. Copia y pega el contenido completo de `supabase-schema.sql`
4. Ejecuta el script
5. ¡Listo! Ya tienes las tablas actualizadas con colaboradores iniciales

### Opción 2: Migración de Datos Existentes

Si ya tienes datos en tu base de datos:

#### Paso 1: Crear nuevas tablas
```sql
-- Crear tabla de colaboradores
CREATE TABLE collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de asignaciones
CREATE TABLE task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, collaborator_id)
);

-- Índices
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_collaborator_id ON task_assignments(collaborator_id);

-- Políticas RLS
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON task_assignments FOR ALL USING (true) WITH CHECK (true);
```

#### Paso 2: Migrar colaboradores desde tareas existentes
```sql
-- Insertar colaboradores únicos de las tareas existentes
INSERT INTO collaborators (name)
SELECT DISTINCT assignee 
FROM tasks 
WHERE assignee IS NOT NULL AND assignee != '';

-- Crear asignaciones basadas en los datos antiguos
INSERT INTO task_assignments (task_id, collaborator_id)
SELECT t.id, c.id
FROM tasks t
JOIN collaborators c ON c.name = t.assignee
WHERE t.assignee IS NOT NULL AND t.assignee != '';
```

#### Paso 3: Actualizar auditoría
```sql
-- Eliminar columna changed_by de task_audit
ALTER TABLE task_audit DROP COLUMN IF EXISTS changed_by;
```

#### Paso 4: Limpiar tabla tasks (OPCIONAL - después de verificar que todo funciona)
```sql
-- Una vez que verifiques que todo funciona correctamente, 
-- puedes eliminar la columna assignee de tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee;
```

## Nuevas Funcionalidades

### 1. Mantenimiento de Colaboradores
- **Ruta**: `/collaborators`
- **Acceso**: Desde el botón "Colaboradores" en la página principal
- **Funciones**: Agregar, editar y eliminar colaboradores

### 2. Asignación Múltiple en Tareas
- Selección de múltiples colaboradores por tarea mediante checkboxes
- Visualización clara de colaboradores asignados
- Actualización automática en tiempo real

### 3. Exportación Excel Actualizada
- Incluye todos los colaboradores asignados en una sola celda
- Formato legible con nombres separados por comas

## Verificación Post-Migración

1. Ve a `/collaborators` y verifica que aparezcan los colaboradores
2. Abre un tablero existente y verifica las asignaciones
3. Asigna múltiples colaboradores a una tarea
4. Exporta a Excel y verifica el formato

## Soporte

Si tienes problemas con la migración, verifica:
- Que todas las políticas RLS estén activas
- Que los índices se hayan creado correctamente
- Que la aplicación esté conectada a la base de datos correcta
