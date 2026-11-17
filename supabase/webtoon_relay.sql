-- 릴레이 웹툰 모드: 팀이 차례대로 컷을 이어 써서 하나의 웹툰을 완성
-- (webtoon.sql 실행 후에 실행)
alter table public.otoon_config add column if not exists current_turn int not null default 0;

-- t팀이 맡는 컷 목록: 선택된 컷을 팀 수로 순서대로 나눔
create or replace function public.otoon_chunk(p_team int, p_teams int, p_panels int[])
returns int[] language sql immutable as $$
  select coalesce(p_panels[(floor((p_team-1)*array_length(p_panels,1)::numeric/p_teams))::int+1 : (floor(p_team*array_length(p_panels,1)::numeric/p_teams))::int], '{}');
$$;

create or replace function public.otoon_relay_save(p_team int, p_panel int, p_idx int, p_text text)
returns void language plpgsql security definer set search_path=public as $$
declare c public.otoon_config;
begin
  select * into c from public.otoon_config where id=1;
  if not c.editing_open then raise exception 'editing closed'; end if;
  if c.current_turn <> p_team then raise exception 'not your turn'; end if;
  if not (p_panel = any(public.otoon_chunk(p_team, c.team_count, c.panels))) or p_idx<0 or p_idx>3 then raise exception 'out of range'; end if;
  delete from public.otoon_bubbles where panel=p_panel and idx=p_idx and team<>p_team;
  insert into public.otoon_bubbles(team,panel,idx,text,updated_at)
  values(p_team,p_panel,p_idx,left(coalesce(p_text,''),80),now())
  on conflict(team,panel,idx) do update set text=excluded.text, updated_at=now();
end $$;

-- 자기 차례인 팀이 다음 팀에게 넘김 (맡은 컷이 없는 팀은 건너뜀)
create or replace function public.otoon_pass_turn(p_team int)
returns int language plpgsql security definer set search_path=public as $$
declare c public.otoon_config; t int;
begin
  select * into c from public.otoon_config where id=1 for update;
  if c.current_turn <> p_team then raise exception 'not your turn'; end if;
  t := p_team + 1;
  while t <= c.team_count and coalesce(array_length(public.otoon_chunk(t, c.team_count, c.panels),1),0)=0 loop t := t+1; end loop;
  update public.otoon_config set current_turn=t, updated_at=now() where id=1;
  return t;
end $$;

-- 관리자: 차례 직접 지정 (0=시작 전, team_count+1=완성)
create or replace function public.otoon_admin_set_turn(p_pin text, p_turn int)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.otoon_admin_check(p_pin) then raise exception 'bad pin'; end if;
  update public.otoon_config set current_turn=greatest(0, least(team_count+1, p_turn)), updated_at=now() where id=1;
end $$;

create or replace function public.otoon_admin_reset(p_pin text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.otoon_admin_check(p_pin) then raise exception 'bad pin'; end if;
  delete from public.otoon_bubbles where true;
  delete from public.otoon_teams where true;
  update public.otoon_config set current_turn=0, updated_at=now() where id=1;
end $$;

revoke all on function public.otoon_relay_save(int,int,int,text) from public;
revoke all on function public.otoon_pass_turn(int) from public;
revoke all on function public.otoon_admin_set_turn(text,int) from public;
grant execute on function public.otoon_relay_save(int,int,int,text) to anon, authenticated;
grant execute on function public.otoon_pass_turn(int) to anon, authenticated;
grant execute on function public.otoon_admin_set_turn(text,int) to anon, authenticated;
grant execute on function public.otoon_admin_reset(text) to anon, authenticated;
