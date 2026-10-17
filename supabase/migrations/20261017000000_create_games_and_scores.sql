-- Catálogo mínimo de juegos: existe para el FK de scores.
-- El front sigue leyendo src/data/games.ts; mover el catálogo completo a la BD es un spec futuro.
create table public.games (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games (id) on delete cascade,
  initials text not null check (char_length(initials) between 1 and 10),
  score integer not null check (score >= 0),
  user_id uuid null, -- reservado para el spec futuro de auth
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_public" on public.games
  for select using (true);

create policy "scores_select_public" on public.scores
  for select using (true);

create policy "scores_insert_public" on public.scores
  for insert with check (true);
-- Sin políticas de update/delete: solo el service role puede modificar filas existentes.

insert into public.games (id, title) values
  ('bloque-buster', 'BLOQUE BUSTER'),
  ('caida', 'CAÍDA'),
  ('serpentina', 'SERPENTINA'),
  ('gloton', 'GLOTÓN'),
  ('invasores', 'INVASORES'),
  ('rocas', 'ROCAS'),
  ('ranaria', 'RANARIA'),
  ('duelo-pixel', 'DUELO PIXEL');
