-- 制約確認SQL（SPEC 7.2）
-- マイグレーション適用後のDBで実行する。期待どおりでない場合は例外で止まる。
-- すべてのデータ変更は最後に ROLLBACK するため、DBには何も残らない。
--
-- 実行方法の例：
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/constraints.sql
--   （または Supabase の SQL Editor に貼り付けて実行する）

begin;

-- テスト用の記録（2026-10-01 09:00〜10:00 JST）
insert into public.time_entries (category_id, started_at, ended_at)
select id, '2026-10-01 09:00+09', '2026-10-01 10:00+09'
from public.categories where name = '読書';

-- 期待した SQLSTATE（カンマ区切りで複数指定可）のエラーになることを確認する
create function pg_temp.expect_error(label text, statement text, expected_state text) returns void
  language plpgsql
as $$
declare
  actual_state text;
begin
  begin
    execute statement;
  exception when others then
    get stacked diagnostics actual_state = returned_sqlstate;
    if actual_state = any (string_to_array(expected_state, ',')) then
      raise notice 'OK: %', label;
      return;
    end if;
    raise exception 'NG: % (期待した SQLSTATE: %, 実際: % %)', label, expected_state, actual_state, sqlerrm;
  end;
  raise exception 'NG: % (エラーにならなかった)', label;
end;
$$;

-- エラーにならず登録できることを確認する
create function pg_temp.expect_ok(label text, statement text) returns void
  language plpgsql
as $$
begin
  execute statement;
  raise notice 'OK: %', label;
end;
$$;

-- 1. 進行中の2件目はエラー
--    進行中の記録は終了が無限大の範囲になるため、2件目は必ず重なりにもなる。
--    部分ユニークインデックス（23505）と排他制約（23P01）のどちらで止まってもよい。
--    部分ユニークインデックス自体の存在は 6. で確認する。
select pg_temp.expect_ok(
  '進行中の1件目は登録できる',
  $sql$
    insert into public.time_entries (category_id, started_at)
    select id, '2026-10-02 09:00+09' from public.categories where name = '仕事'
  $sql$
);
select pg_temp.expect_error(
  '進行中の2件目はエラーになる',
  $sql$
    insert into public.time_entries (category_id, started_at)
    select id, '2026-10-03 09:00+09' from public.categories where name = '睡眠'
  $sql$,
  '23505,23P01'
);

-- 2. 時間の重なりはエラー（排他制約：23P01）
select pg_temp.expect_error(
  '既存の記録と時間が重なるとエラーになる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-10-01 09:30+09', '2026-10-01 10:30+09' from public.categories where name = 'X'
  $sql$,
  '23P01'
);
select pg_temp.expect_error(
  '進行中の記録（終了が無限大）と時間が重なるとエラーになる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-10-05 09:00+09', '2026-10-05 10:00+09' from public.categories where name = 'X'
  $sql$,
  '23P01'
);

-- 3. 終了が開始より前（同時刻も含む）はエラー（CHECK：23514）
select pg_temp.expect_error(
  '終了が開始より前だとエラーになる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-09-01 10:00+09', '2026-09-01 09:00+09' from public.categories where name = 'ジム'
  $sql$,
  '23514'
);
select pg_temp.expect_error(
  '終了と開始が同時刻だとエラーになる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-09-01 10:00+09', '2026-09-01 10:00+09' from public.categories where name = 'ジム'
  $sql$,
  '23514'
);

-- 4. 不正な kind はエラー（CHECK：23514）
select pg_temp.expect_error(
  '不正な kind のカテゴリはエラーになる',
  $sql$
    insert into public.categories (name, color, kind) values ('不正', '#000000', 'unknown')
  $sql$,
  '23514'
);

-- 5. 端が接する記録は登録できる
select pg_temp.expect_ok(
  '直前の記録の終了時刻ちょうどに始まる記録は登録できる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-10-01 10:00+09', '2026-10-01 11:00+09' from public.categories where name = 'YouTube'
  $sql$
);
select pg_temp.expect_ok(
  '直後の記録の開始時刻ちょうどに終わる記録は登録できる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-10-01 08:00+09', '2026-10-01 09:00+09' from public.categories where name = '食事・家事・身支度'
  $sql$
);
select pg_temp.expect_ok(
  '進行中の記録の開始時刻ちょうどに終わる記録は登録できる',
  $sql$
    insert into public.time_entries (category_id, started_at, ended_at)
    select id, '2026-10-02 08:00+09', '2026-10-02 09:00+09' from public.categories where name = '移動'
  $sql$
);

-- 6. 初期データ・RLS・部分ユニークインデックス
do $$
begin
  if (
    select count(*) from public.categories
    where (name, kind, requires_topic, counts_toward_goal) in (
      ('自己学習', 'productive', true, true), ('読書', 'productive', false, true),
      ('ジム', 'productive', false, false), ('仕事', 'neutral', false, false),
      ('睡眠', 'neutral', false, false), ('移動', 'neutral', false, false),
      ('食事・家事・身支度', 'neutral', false, false),
      ('休憩・娯楽（意図したもの）', 'neutral', false, false),
      ('X', 'waste', false, false), ('Instagram', 'waste', false, false),
      ('YouTube', 'waste', false, false)
    )
  ) <> 11 then
    raise exception 'NG: 初期カテゴリ11件がそろっていない';
  end if;
  if (
    select count(*) from public.study_topics where name in ('事業所得', 'AI', '株', 'その他')
  ) <> 4 then
    raise exception 'NG: 学習内容4件がそろっていない';
  end if;
  if exists (
    select 1 from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in ('categories', 'study_topics', 'time_entries')
      and not relrowsecurity
  ) then
    raise exception 'NG: RLS が有効でないテーブルがある';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename in ('categories', 'study_topics', 'time_entries')
  ) then
    raise exception 'NG: ポリシーが作られている';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'time_entries'
      and indexname = 'time_entries_one_running'
      and indexdef like 'CREATE UNIQUE INDEX%WHERE (ended_at IS NULL)'
  ) then
    raise exception 'NG: 進行中は1件のみの部分ユニークインデックスがない';
  end if;
  raise notice 'OK: 初期データ・RLS・部分ユニークインデックス';
end;
$$;

rollback;
