-- STAR: cloud save for signed-in players, and the daily race leaderboard.

-- One backup per account: the main career as the device stores it.
create table if not exists career_saves (
  user_id text primary key references "user" ("id") on delete cascade,
  data jsonb not null,
  save_version integer not null,
  player_name text not null,
  season_year integer not null,
  updated_at timestamptz default now() not null
);

-- Daily race results. No account needed: one row per device per day, keeping
-- its best result (fewest seasons, then earliest try). Unowned rows, so the
-- table holds only a display name the player typed and game numbers.
create table if not exists daily_scores (
  day text not null,
  device_id text not null,
  name text not null,
  position text not null,
  seasons integer not null,
  try integer not null,
  created_at timestamptz default now() not null,
  primary key (day, device_id)
);

create index if not exists daily_scores_rank on daily_scores (day, seasons, try, created_at);
