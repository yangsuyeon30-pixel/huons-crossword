-- 휴온스 금고를 열어라 — Supabase 스키마 (vault_ 접두사 테이블만 생성)
create table if not exists public.vault_game (
  id int primary key default 1 check (id = 1),
  status text not null default 'waiting' check (status in ('waiting','running','ended')),
  started_at timestamptz,
  duration_sec int not null default 1800,
  round int not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists public.vault_questions (
  id int primary key check (id between 1 and 4),
  question text not null,
  answer text not null,
  hint text not null default ''
);
create table if not exists public.vault_teams (
  id uuid primary key default gen_random_uuid(),
  round int not null,
  name text not null,
  stage int not null default 0,
  wrong_total int not null default 0,
  wrong_by_stage int[] not null default '{0,0,0,0}',
  hints_used int not null default 0,
  hint_stages int[] not null default '{}',
  finished_at timestamptz,
  elapsed_sec int,
  created_at timestamptz not null default now(),
  unique (round, name)
);
create table if not exists public.vault_team_tokens (
  team_id uuid primary key references public.vault_teams(id) on delete cascade,
  token uuid not null default gen_random_uuid()
);
create table if not exists public.vault_config (key text primary key, value text not null);

alter table public.vault_game enable row level security;
alter table public.vault_questions enable row level security;
alter table public.vault_teams enable row level security;
alter table public.vault_team_tokens enable row level security;
alter table public.vault_config enable row level security;

drop policy if exists vault_game_read on public.vault_game;
create policy vault_game_read on public.vault_game for select to anon, authenticated using (true);
drop policy if exists vault_teams_read on public.vault_teams;
create policy vault_teams_read on public.vault_teams for select to anon, authenticated using (true);

alter table public.vault_teams replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='vault_game') then
    alter publication supabase_realtime add table public.vault_game;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='vault_teams') then
    alter publication supabase_realtime add table public.vault_teams;
  end if;
end $$;

insert into public.vault_game (id) values (1) on conflict do nothing;
insert into public.vault_config values ('admin_password', 'huons2026') on conflict do nothing;
insert into public.vault_questions values
 (1, '휴온스그룹이 창립한 연도는? (숫자 4자리)', '1965', '2025년에 창립 60주년을 맞았어요'),
 (2, '창립 ○○주년 + FDA 승인 주사제 ○종을 이어 붙여라! (숫자 3자리)', '607', '60주년, 그리고 미국에서 허가받은 주사제 수'),
 (3, '보툴리눔 톡신 ''리즈톡스''의 이름은 누구에게나 있던 ''○○ 시절''로 돌려준다는 뜻! (글자 2자리)', '리즈', '가장 빛나던 전성기를 부르는 말'),
 (4, '필러 ''엘라비에''로 유명한 에스테틱 전문 가족사는?', '휴메딕스', '''휴''로 시작하는 네 글자')
on conflict (id) do nothing;

create or replace function public.vault_norm(t text) returns text
language sql immutable set search_path = public as $$
  select lower(regexp_replace(coalesce(t,''), '\s', '', 'g'))
$$;

create or replace function public.vault_auth(p_team uuid, p_token uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from vault_team_tokens k join vault_teams t on t.id = k.team_id
                join vault_game g on g.id = 1 and g.round = t.round
                where k.team_id = p_team and k.token = p_token)
$$;

create or replace function public.vault_is_admin(p_pw text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from vault_config where key = 'admin_password' and value = p_pw)
$$;

create or replace function public.vault_now() returns timestamptz
language sql stable set search_path = public as $$ select now() $$;

create or replace function public.vault_join(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_name,'')); v_id uuid; v_tok uuid; v_round int;
begin
  if length(v_name) < 1 or length(v_name) > 20 then raise exception 'BAD_NAME'; end if;
  select round into v_round from vault_game where id = 1;
  if exists(select 1 from vault_teams where round = v_round and lower(name) = lower(v_name)) then raise exception 'TEAM_EXISTS'; end if;
  insert into vault_teams(round, name) values (v_round, v_name) returning id into v_id;
  insert into vault_team_tokens(team_id) values (v_id) returning token into v_tok;
  return json_build_object('team_id', v_id, 'token', v_tok, 'round', v_round);
end $$;

create or replace function public.vault_state(p_team uuid, p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game; q vault_questions; v_q json := null;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into t from vault_teams where id = p_team;
  select * into g from vault_game where id = 1;
  if g.status <> 'waiting' and t.stage < 4 then
    select * into q from vault_questions where id = t.stage + 1;
    v_q := json_build_object('no', q.id, 'text', q.question,
      'hint', case when (t.stage + 1) = any(t.hint_stages) then q.hint else null end);
  end if;
  return json_build_object(
    'team', json_build_object('id', t.id, 'name', t.name, 'stage', t.stage, 'wrong_total', t.wrong_total,
       'hints_used', t.hints_used, 'finished_at', t.finished_at, 'elapsed_sec', t.elapsed_sec),
    'game', json_build_object('status', g.status, 'started_at', g.started_at, 'duration_sec', g.duration_sec,
       'round', g.round, 'server_now', now()),
    'question', v_q);
end $$;

create or replace function public.vault_submit(p_team uuid, p_token uuid, p_answer text) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game; q vault_questions; v_ok boolean;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into g from vault_game where id = 1;
  if g.status <> 'running' then raise exception 'NOT_RUNNING'; end if;
  if now() > g.started_at + make_interval(secs => g.duration_sec) then raise exception 'TIME_UP'; end if;
  select * into t from vault_teams where id = p_team for update;
  if t.stage >= 4 then return json_build_object('correct', true, 'state', vault_state(p_team, p_token)); end if;
  select * into q from vault_questions where id = t.stage + 1;
  v_ok := vault_norm(p_answer) <> '' and vault_norm(p_answer) = vault_norm(q.answer);
  if v_ok then
    update vault_teams set stage = stage + 1,
      finished_at = case when t.stage + 1 = 4 then now() else null end,
      elapsed_sec = case when t.stage + 1 = 4 then floor(extract(epoch from now() - g.started_at))::int else null end
    where id = p_team;
  else
    update vault_teams set wrong_total = wrong_total + 1,
      wrong_by_stage[t.stage + 1] = wrong_by_stage[t.stage + 1] + 1
    where id = p_team;
  end if;
  return json_build_object('correct', v_ok, 'state', vault_state(p_team, p_token));
end $$;

create or replace function public.vault_hint(p_team uuid, p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into g from vault_game where id = 1;
  if g.status <> 'running' then raise exception 'NOT_RUNNING'; end if;
  select * into t from vault_teams where id = p_team for update;
  if t.stage >= 4 then raise exception 'DONE'; end if;
  if not ((t.stage + 1) = any(t.hint_stages)) then
    if t.hints_used >= 3 then raise exception 'NO_HINTS'; end if;
    update vault_teams set hints_used = hints_used + 1, hint_stages = array_append(hint_stages, t.stage + 1)
    where id = p_team;
  end if;
  return vault_state(p_team, p_token);
end $$;

create or replace function public.vault_admin_login(p_pw text) returns boolean
language sql stable security definer set search_path = public as $$ select vault_is_admin(p_pw) $$;

create or replace function public.vault_admin_questions(p_pw text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not vault_is_admin(p_pw) then raise exception 'BAD_PASSWORD'; end if;
  return (select json_agg(row_to_json(q) order by q.id) from vault_questions q);
end $$;

create or replace function public.vault_admin_save_questions(p_pw text, p_items jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if not vault_is_admin(p_pw) then raise exception 'BAD_PASSWORD'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    update vault_questions set question = it->>'question', answer = it->>'answer', hint = coalesce(it->>'hint','')
    where id = (it->>'id')::int;
  end loop;
  return vault_admin_questions(p_pw);
end $$;

create or replace function public.vault_admin_start(p_pw text, p_duration_min int default 30) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not vault_is_admin(p_pw) then raise exception 'BAD_PASSWORD'; end if;
  update vault_teams set stage = 0, wrong_total = 0, wrong_by_stage = '{0,0,0,0}', hints_used = 0,
    hint_stages = '{}', finished_at = null, elapsed_sec = null
  where round = (select round from vault_game where id = 1);
  update vault_game set status = 'running', started_at = now(),
    duration_sec = greatest(1, coalesce(p_duration_min, 30)) * 60, updated_at = now() where id = 1;
end $$;

create or replace function public.vault_admin_stop(p_pw text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not vault_is_admin(p_pw) then raise exception 'BAD_PASSWORD'; end if;
  update vault_game set status = 'ended', updated_at = now() where id = 1;
end $$;

-- 초기화: 회차(round)를 올려 이전 팀을 게임/화면에서 제외 (행 삭제 없음)
create or replace function public.vault_admin_reset(p_pw text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not vault_is_admin(p_pw) then raise exception 'BAD_PASSWORD'; end if;
  update vault_game set status = 'waiting', started_at = null, round = round + 1, updated_at = now() where id = 1;
end $$;

grant execute on function public.vault_now(), public.vault_join(text), public.vault_state(uuid, uuid),
  public.vault_submit(uuid, uuid, text), public.vault_hint(uuid, uuid), public.vault_admin_login(text),
  public.vault_admin_questions(text), public.vault_admin_save_questions(text, jsonb),
  public.vault_admin_start(text, int), public.vault_admin_stop(text), public.vault_admin_reset(text)
  to anon, authenticated;

-- ===== 방탈출 자물쇠 종류: 숫자 정답 → 다이얼, 그 외 → 글자 타일 (vault_state 재정의) =====
create or replace function public.vault_lock_info(p_team uuid, p_answer text) returns json
language plpgsql stable security definer set search_path = public as $$
declare v_clean text := upper(regexp_replace(coalesce(p_answer,''), '\s', '', 'g'));
        v_kind text; v_tiles json := null; v_seed text;
        v_pool text := '휴온스메딕리즈바이오제약톡신필러엘라비에생명건강글로벌주사백신연구미래';
begin
  v_seed := md5(p_team::text || v_clean);
  v_kind := case when v_clean ~ '^[0-9]+$' then 'digits' else 'letters' end;
  if v_kind = 'letters' then
    with ans as (select c, ord from regexp_split_to_table(v_clean, '') with ordinality as x(c, ord)),
    dec as (select distinct c from regexp_split_to_table(v_pool, '') as y(c) where position(c in v_clean) = 0),
    dec_pick as (select c from dec order by md5(v_seed || 'pick' || c) limit greatest(4, 12 - char_length(v_clean))),
    allc as (select c, 'a' || ord || c as k from ans union all select c, 'd' || c from dec_pick)
    select json_agg(c order by md5(v_seed || 'ord' || k)) into v_tiles from allc;
  end if;
  return json_build_object('kind', v_kind, 'len', char_length(v_clean), 'tiles', v_tiles);
end $$;

create or replace function public.vault_state(p_team uuid, p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game; q vault_questions; v_q json := null; v_keys json;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into t from vault_teams where id = p_team;
  select * into g from vault_game where id = 1;
  if g.status <> 'waiting' and t.stage < 4 then
    select * into q from vault_questions where id = t.stage + 1;
    v_q := json_build_object('no', q.id, 'text', q.question,
      'hint', case when (t.stage + 1) = any(t.hint_stages) then q.hint else null end,
      'lock', vault_lock_info(p_team, q.answer));
  end if;
  select coalesce(json_agg(regexp_replace(answer, '\s', '', 'g') order by id), '[]'::json) into v_keys
    from vault_questions where id <= t.stage;
  return json_build_object(
    'team', json_build_object('id', t.id, 'name', t.name, 'stage', t.stage, 'wrong_total', t.wrong_total,
       'hints_used', t.hints_used, 'finished_at', t.finished_at, 'elapsed_sec', t.elapsed_sec),
    'game', json_build_object('status', g.status, 'started_at', g.started_at, 'duration_sec', g.duration_sec,
       'round', g.round, 'server_now', now()),
    'question', v_q,
    'keys', v_keys);
end $$;

-- ===== 감옥 탈출 테마: 조 개수 / 캐릭터 선택 / 관리자 비밀번호 해제 =====
alter table public.vault_game add column if not exists team_count int not null default 8;
alter table public.vault_teams add column if not exists team_no int;
alter table public.vault_teams add column if not exists character int;

-- 관리자 비밀번호 해제 (요청에 따라 누구나 관리자 화면 사용)
create or replace function public.vault_is_admin(p_pw text) returns boolean
language sql stable set search_path = public as $$ select true $$;

create or replace function public.vault_enter(p_no int, p_char int) returns json
language plpgsql security definer set search_path = public as $$
declare g vault_game; v_id uuid; v_tok uuid;
begin
  select * into g from vault_game where id = 1 for update;
  if p_no is null or p_no < 1 or p_no > g.team_count then raise exception 'BAD_TEAM'; end if;
  if p_char is null or p_char < 0 or p_char > 9 then raise exception 'BAD_CHAR'; end if;
  if exists(select 1 from vault_teams where round = g.round and team_no = p_no) then raise exception 'TEAM_EXISTS'; end if;
  if exists(select 1 from vault_teams where round = g.round and character = p_char) then raise exception 'CHAR_TAKEN'; end if;
  insert into vault_teams(round, name, team_no, character) values (g.round, p_no || '조', p_no, p_char) returning id into v_id;
  insert into vault_team_tokens(team_id) values (v_id) returning token into v_tok;
  return json_build_object('team_id', v_id, 'token', v_tok, 'round', g.round);
end $$;

create or replace function public.vault_admin_set_teams(p_pw text, p_count int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_count is null or p_count < 1 or p_count > 30 then raise exception 'BAD_COUNT'; end if;
  update vault_game set team_count = p_count, updated_at = now() where id = 1;
end $$;

create or replace function public.vault_state(p_team uuid, p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game; q vault_questions; v_q json := null; v_keys json;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into t from vault_teams where id = p_team;
  select * into g from vault_game where id = 1;
  if g.status <> 'waiting' and t.stage < 4 then
    select * into q from vault_questions where id = t.stage + 1;
    v_q := json_build_object('no', q.id, 'text', q.question,
      'hint', case when (t.stage + 1) = any(t.hint_stages) then q.hint else null end,
      'lock', vault_lock_info(p_team, q.answer));
  end if;
  select coalesce(json_agg(regexp_replace(answer, '\s', '', 'g') order by id), '[]'::json) into v_keys
    from vault_questions where id <= t.stage;
  return json_build_object(
    'team', json_build_object('id', t.id, 'name', t.name, 'team_no', t.team_no, 'character', t.character,
       'stage', t.stage, 'wrong_total', t.wrong_total,
       'hints_used', t.hints_used, 'finished_at', t.finished_at, 'elapsed_sec', t.elapsed_sec),
    'game', json_build_object('status', g.status, 'started_at', g.started_at, 'duration_sec', g.duration_sec,
       'round', g.round, 'team_count', g.team_count, 'server_now', now()),
    'question', v_q,
    'keys', v_keys);
end $$;

grant execute on function public.vault_enter(int, int), public.vault_admin_set_teams(text, int) to anon, authenticated;

-- ===== 방탈출 퍼즐 재료: 미끼 숫자 / 자모 조각 / 섞인 정답 글자 (vault_state에 'puzzle'로 포함) =====
create or replace function public.vault_puzzle(p_team uuid, p_answer text) returns json
language plpgsql stable security definer set search_path = public as $$
declare v_clean text := upper(regexp_replace(coalesce(p_answer,''), '\s', '', 'g'));
        v_seed text := md5(p_team::text || v_clean || 'pz');
        cho text[] := string_to_array('ㄱ,ㄲ,ㄴ,ㄷ,ㄸ,ㄹ,ㅁ,ㅂ,ㅃ,ㅅ,ㅆ,ㅇ,ㅈ,ㅉ,ㅊ,ㅋ,ㅌ,ㅍ,ㅎ', ',');
        jung text[] := string_to_array('ㅏ,ㅐ,ㅑ,ㅒ,ㅓ,ㅔ,ㅕ,ㅖ,ㅗ,ㅘ,ㅙ,ㅚ,ㅛ,ㅜ,ㅝ,ㅞ,ㅟ,ㅠ,ㅡ,ㅢ,ㅣ', ',');
        jong text[] := string_to_array(',ㄱ,ㄲ,ㄳ,ㄴ,ㄵ,ㄶ,ㄷ,ㄹ,ㄺ,ㄻ,ㄼ,ㄽ,ㄾ,ㄿ,ㅀ,ㅁ,ㅂ,ㅄ,ㅅ,ㅆ,ㅇ,ㅈ,ㅊ,ㅋ,ㅌ,ㅍ,ㅎ', ',');
        c text; code int; parts text[] := '{}'; ok boolean := true; v_jamo json := null; v_decoy_d json; v_scr json;
begin
  select json_agg(d) into v_decoy_d from (
    select d from regexp_split_to_table('0123456789', '') d where position(d in v_clean) = 0
    order by md5(v_seed || d) limit 3) x;
  select json_agg(ch order by md5(v_seed || 's' || ord || ch)) into v_scr
    from regexp_split_to_table(v_clean, '') with ordinality as x(ch, ord);
  foreach c in array regexp_split_to_array(v_clean, '') loop
    code := ascii(c) - 44032;
    if code < 0 or code > 11171 then ok := false; exit; end if;
    parts := parts || cho[code / 588 + 1] || jung[(code % 588) / 28 + 1];
    if code % 28 > 0 then parts := parts || jong[code % 28 + 1]; end if;
  end loop;
  if ok and array_length(parts, 1) > 0 then
    with a as (select p, ord from unnest(parts) with ordinality as x(p, ord)),
    dc as (select p from regexp_split_to_table('ㅁ,ㅅ,ㄴ,ㅂ,ㅎ,ㅇ,ㄱ', ',') p
          where not (p = any(parts)) order by md5(v_seed || 'c' || p) limit 2),
    dv as (select p from regexp_split_to_table('ㅗ,ㅏ,ㅓ,ㅜ,ㅐ,ㅣ,ㅡ', ',') p
          where not (p = any(parts)) order by md5(v_seed || 'v' || p) limit 2),
    allp as (select p, 'a' || ord || p k from a union all select p, 'd' || p from dc union all select p, 'e' || p from dv)
    select json_agg(p order by md5(v_seed || 'o' || k)) into v_jamo from allp;
  end if;
  return json_build_object('decoy_digits', v_decoy_d, 'jamo', v_jamo, 'scramble', v_scr);
end $$;

create or replace function public.vault_state(p_team uuid, p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare t vault_teams; g vault_game; q vault_questions; v_q json := null; v_keys json;
begin
  if not vault_auth(p_team, p_token) then raise exception 'NO_TEAM'; end if;
  select * into t from vault_teams where id = p_team;
  select * into g from vault_game where id = 1;
  if g.status <> 'waiting' and t.stage < 4 then
    select * into q from vault_questions where id = t.stage + 1;
    v_q := json_build_object('no', q.id, 'text', q.question,
      'hint', case when (t.stage + 1) = any(t.hint_stages) then q.hint else null end,
      'lock', vault_lock_info(p_team, q.answer),
      'puzzle', vault_puzzle(p_team, q.answer));
  end if;
  select coalesce(json_agg(regexp_replace(answer, '\s', '', 'g') order by id), '[]'::json) into v_keys
    from vault_questions where id <= t.stage;
  return json_build_object(
    'team', json_build_object('id', t.id, 'name', t.name, 'team_no', t.team_no, 'character', t.character,
       'stage', t.stage, 'wrong_total', t.wrong_total,
       'hints_used', t.hints_used, 'finished_at', t.finished_at, 'elapsed_sec', t.elapsed_sec),
    'game', json_build_object('status', g.status, 'started_at', g.started_at, 'duration_sec', g.duration_sec,
       'round', g.round, 'team_count', g.team_count, 'server_now', now()),
    'question', v_q,
    'keys', v_keys);
end $$;
