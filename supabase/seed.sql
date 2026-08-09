-- ============================================================================
-- Nani — datos semilla
-- Correr DESPUÉS de 0001_init.sql. Ajusta nombre/fecha_nacimiento del bebé.
-- ============================================================================

-- 1) Bebé -------------------------------------------------------------------
insert into public.babies (nombre, fecha_nacimiento)
values ('Nombre del bebé', '2026-01-01')
returning id; -- copia este id, lo necesitas para los pasos 2 y 3

-- 2) Categorías de eventos ----------------------------------------------
-- Reemplaza '<BABY_ID>' por el id devuelto arriba.
insert into public.event_categories (baby_id, nombre, tipo, color, icono, orden)
values
  ('<BABY_ID>', 'Seno izquierdo',        'duracion',    '#ec4899', 'breast-left',  1),
  ('<BABY_ID>', 'Seno derecho',          'duracion',    '#db2777', 'breast-right', 2),
  ('<BABY_ID>', 'Biberón',               'duracion',    '#f59e0b', 'bottle',       3),
  ('<BABY_ID>', 'Pañal - pipí',          'instantaneo', '#38bdf8', 'droplet',      4),
  ('<BABY_ID>', 'Pañal - popó',          'instantaneo', '#a16207', 'diaper',       5),
  ('<BABY_ID>', 'Pañal - pipí y popó',   'instantaneo', '#78716c', 'diaper-mix',   6),
  ('<BABY_ID>', 'Sueño',                 'duracion',    '#6366f1', 'moon',         7);

-- 3) Caregivers ---------------------------------------------------------
-- Primero crea los dos usuarios en Supabase Auth (Authentication > Users,
-- o vía la pantalla de sign-up de la app) con usuario/contraseña.
-- Luego vincúlalos al baby_id de arriba:
insert into public.caregivers (user_id, baby_id, nombre_display)
values
  ((select id from auth.users where email = 'papa@example.com'),  '<BABY_ID>', 'Papá'),
  ((select id from auth.users where email = 'mama@example.com'),  '<BABY_ID>', 'Mamá');
