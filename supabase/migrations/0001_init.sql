-- ============================================================================
-- Nani — esquema inicial
-- Ejecutar en el SQL editor de Supabase (o vía `supabase db push`).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_nacimiento date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.caregivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  baby_id uuid not null references public.babies (id) on delete cascade,
  nombre_display text not null,
  created_at timestamptz not null default now(),
  unique (user_id, baby_id)
);

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('duracion', 'instantaneo')),
  color text not null default '#6366f1',
  icono text not null default 'circle',
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  category_id uuid not null references public.event_categories (id) on delete restrict,
  caregiver_id uuid not null references public.caregivers (id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  notas text,
  origen text not null default 'boton' check (origen in ('voz', 'boton')),
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index if not exists idx_caregivers_user_id on public.caregivers (user_id);
create index if not exists idx_caregivers_baby_id on public.caregivers (baby_id);
create index if not exists idx_event_categories_baby_id on public.event_categories (baby_id);
create index if not exists idx_events_baby_started_at on public.events (baby_id, started_at desc);
create index if not exists idx_events_category_id on public.events (category_id);
create index if not exists idx_events_caregiver_id on public.events (caregiver_id);
-- Acelera la búsqueda del cronómetro abierto por categoría (ended_at is null).
create index if not exists idx_events_open on public.events (baby_id, category_id) where ended_at is null;

-- ----------------------------------------------------------------------------
-- duration_seconds se calcula automáticamente al cerrar el evento
-- (started_at/ended_at son la fuente de verdad; el trigger evita depender
-- del reloj del cliente).
-- ----------------------------------------------------------------------------

create or replace function public.compute_event_duration()
returns trigger
language plpgsql
as $$
begin
  if new.ended_at is not null then
    new.duration_seconds := extract(epoch from (new.ended_at - new.started_at))::int;
  else
    new.duration_seconds := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_compute_event_duration on public.events;
create trigger trg_compute_event_duration
  before insert or update on public.events
  for each row
  execute function public.compute_event_duration();

-- ----------------------------------------------------------------------------
-- Helper de autorización: ¿el usuario autenticado es caregiver de este baby?
-- SECURITY DEFINER + dueño de la tabla => evita recursión de RLS sobre
-- "caregivers" al usarla dentro de las políticas de las demás tablas.
-- ----------------------------------------------------------------------------

create or replace function public.is_caregiver_of_baby(target_baby_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.caregivers c
    where c.baby_id = target_baby_id
      and c.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.babies enable row level security;
alter table public.caregivers enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;

-- babies: visibles para sus caregivers. Alta/edición se hace por SQL/dashboard
-- (solo hay un baby por instancia en el MVP).
create policy "babies_select_own" on public.babies
  for select
  using (public.is_caregiver_of_baby(id));

-- caregivers: cada usuario ve su propia fila y la de su compañero/a
-- (mismo baby_id). Alta/edición se hace por SQL/dashboard.
create policy "caregivers_select_same_baby" on public.caregivers
  for select
  using (
    user_id = auth.uid()
    or public.is_caregiver_of_baby(baby_id)
  );

-- event_categories: visibles para los caregivers del baby correspondiente.
-- Alta/edición se hace por SQL/dashboard (fase 2: UI de configuración).
create policy "event_categories_select_same_baby" on public.event_categories
  for select
  using (public.is_caregiver_of_baby(baby_id));

-- events: lectura y escritura completas para ambos caregivers del baby.
create policy "events_select_same_baby" on public.events
  for select
  using (public.is_caregiver_of_baby(baby_id));

create policy "events_insert_same_baby" on public.events
  for insert
  with check (
    public.is_caregiver_of_baby(baby_id)
    and caregiver_id in (select id from public.caregivers where user_id = auth.uid())
  );

create policy "events_update_same_baby" on public.events
  for update
  using (public.is_caregiver_of_baby(baby_id))
  with check (public.is_caregiver_of_baby(baby_id));

create policy "events_delete_same_baby" on public.events
  for delete
  using (public.is_caregiver_of_baby(baby_id));

-- ----------------------------------------------------------------------------
-- Realtime: los cambios en "events" se transmiten a ambos caregivers.
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.events;
