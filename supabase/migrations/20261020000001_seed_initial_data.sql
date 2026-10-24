-- 初期データ（SPEC 7.3：4.2 の初期カテゴリと 4.4 の学習内容）
-- 色は初期値。変更は DB を直接操作する（SPEC 4.3・4.4）

insert into public.categories (name, color, kind, requires_topic, counts_toward_goal, sort_order) values
  ('自己学習',                   '#2563EB', 'productive', true,  true,  10),
  ('読書',                       '#16A34A', 'productive', false, true,  20),
  ('ジム',                       '#0D9488', 'productive', false, false, 30),
  ('仕事',                       '#64748B', 'neutral',    false, false, 40),
  ('睡眠',                       '#6366F1', 'neutral',    false, false, 50),
  ('移動',                       '#A16207', 'neutral',    false, false, 60),
  ('食事・家事・身支度',         '#D97706', 'neutral',    false, false, 70),
  ('休憩・娯楽（意図したもの）', '#DB2777', 'neutral',    false, false, 80),
  ('X',                          '#DC2626', 'waste',      false, false, 90),
  ('Instagram',                  '#EA580C', 'waste',      false, false, 100),
  ('YouTube',                    '#B91C1C', 'waste',      false, false, 110);

-- 自己学習（#2563EB）の濃淡
insert into public.study_topics (name, color, sort_order) values
  ('事業所得', '#1E3A8A', 10),
  ('AI',       '#1D4ED8', 20),
  ('株',       '#3B82F6', 30),
  ('その他',   '#93C5FD', 40);
