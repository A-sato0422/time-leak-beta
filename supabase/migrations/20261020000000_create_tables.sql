-- テーブル・制約・RLS（SPEC 7.1・7.2）

-- 時間の重なり禁止の排他制約で使う
create extension if not exists btree_gist with schema extensions;

create table public.categories (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  color               text not null,                       -- '#RRGGBB'
  kind                text not null,                       -- 'productive' | 'neutral' | 'waste'
  requires_topic      boolean not null default false,      -- true: 学習内容の選択が必須（自己学習）
  counts_toward_goal  boolean not null default false,      -- true: 週目標の対象（自己学習・読書）
  is_archived         boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  constraint categories_kind_check check (kind in ('productive', 'neutral', 'waste'))
);

create table public.study_topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null,                               -- 自己学習の色の濃淡
  sort_order  integer not null default 0
);

create table public.time_entries (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.categories (id),
  study_topic_id  uuid references public.study_topics (id), -- requires_topic のカテゴリのときのみ（API で検証）
  started_at      timestamptz not null,
  ended_at        timestamptz,                              -- null = 進行中
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- 終了は開始より後
  constraint time_entries_ended_after_started check (ended_at is null or ended_at > started_at),
  -- 時間の重なり禁止。'[)' なので、終了時刻と次の開始時刻が一致する場合は重ならない
  constraint time_entries_no_overlap exclude using gist (
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
  )
);

-- 進行中（ended_at が null）の記録は最大1件
create unique index time_entries_one_running on public.time_entries ((ended_at is null))
  where ended_at is null;

-- 期間での抽出用
create index time_entries_started_at_idx on public.time_entries (started_at);

-- 更新時に updated_at を現在時刻にする
create function public.set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

-- 外部からの直接アクセス禁止。ポリシーは作らない（service role キーからのみアクセスできる）
alter table public.categories enable row level security;
alter table public.study_topics enable row level security;
alter table public.time_entries enable row level security;

-- 「新しいテーブルを Data API に自動で公開する」設定をオフにしているため、
-- Vercel Functions が使う service_role にだけ明示的に権限を与える（anon・authenticated には与えない）
grant select, insert, update, delete on public.categories, public.study_topics, public.time_entries
  to service_role;
