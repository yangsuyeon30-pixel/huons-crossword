-- 오피스 웹툰 대사 만들기 (webtoon.html) 용 테이블/함수
create table if not exists public.otoon_config(
  id int primary key default 1 check (id=1),
  title text not null default '우리 팀 오피스 웹툰',
  team_count int not null default 8 check (team_count between 1 and 30),
  panels int[] not null default '{1,2,3,4,5,6,7,8,9,10}',
  editing_open boolean not null default true,
  gallery_open boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.otoon_config(id) values (1) on conflict do nothing;

create table if not exists public.otoon_teams(
  team int primary key check (team between 1 and 30),
  name text not null default '' check (char_length(name)<=20),
  updated_at timestamptz not null default now()
);

create table if not exists public.otoon_bubbles(
  team int not null check (team between 1 and 30),
  panel int not null check (panel between 1 and 10),
  idx int not null check (idx between 0 and 3),
  text text not null default '' check (char_length(text)<=80),
  updated_at timestamptz not null default now(),
  primary key(team,panel,idx)
);

create table if not exists public.otoon_admin(
  id int primary key default 1 check (id=1),
  pin text not null
);
insert into public.otoon_admin(id,pin) values (1, lpad((floor(random()*1000000))::int::text,6,'0')) on conflict do nothing;

alter table public.otoon_config enable row level security;
alter table public.otoon_teams enable row level security;
alter table public.otoon_bubbles enable row level security;
alter table public.otoon_admin enable row level security;

-- 누구나 읽기만 가능, 쓰기는 아래 함수로만
create policy otoon_config_read on public.otoon_config for select to anon, authenticated using (true);
create policy otoon_teams_read on public.otoon_teams for select to anon, authenticated using (true);
create policy otoon_bubbles_read on public.otoon_bubbles for select to anon, authenticated using (true);

create or replace function public.otoon_save_bubble(p_team int, p_panel int, p_idx int, p_text text)
returns void language plpgsql security definer set search_path=public as $$
declare c public.otoon_config;
begin
  select * into c from public.otoon_config where id=1;
  if not c.editing_open then raise exception 'editing closed'; end if;
  if p_team<1 or p_team>c.team_count or not (p_panel = any(c.panels)) or p_idx<0 or p_idx>3 then raise exception 'out of range'; end if;
  insert into public.otoon_bubbles(team,panel,idx,text,updated_at)
  values(p_team,p_panel,p_idx,left(coalesce(p_text,''),80),now())
  on conflict(team,panel,idx) do update set text=excluded.text, updated_at=now();
end $$;

create or replace function public.otoon_save_team_name(p_team int, p_name text)
returns void language plpgsql security definer set search_path=public as $$
declare c public.otoon_config;
begin
  select * into c from public.otoon_config where id=1;
  if not c.editing_open then raise exception 'editing closed'; end if;
  if p_team<1 or p_team>c.team_count then raise exception 'out of range'; end if;
  insert into public.otoon_teams(team,name,updated_at) values(p_team,left(coalesce(p_name,''),20),now())
  on conflict(team) do update set name=excluded.name, updated_at=now();
end $$;

create or replace function public.otoon_admin_check(p_pin text)
returns boolean language sql security definer set search_path=public as $$
  select exists(select 1 from public.otoon_admin where id=1 and pin=p_pin);
$$;

create or replace function public.otoon_admin_config(p_pin text, p_title text, p_team_count int, p_panels int[], p_editing_open boolean, p_gallery_open boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.otoon_admin_check(p_pin) then raise exception 'bad pin'; end if;
  if coalesce(array_length(p_panels,1),0)<1 then raise exception 'need panels'; end if;
  update public.otoon_config set title=left(coalesce(p_title,''),40), team_count=p_team_count,
    panels=(select array_agg(distinct x order by x) from unnest(p_panels) x where x between 1 and 10),
    editing_open=p_editing_open, gallery_open=p_gallery_open, updated_at=now() where id=1;
end $$;

create or replace function public.otoon_admin_reset(p_pin text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.otoon_admin_check(p_pin) then raise exception 'bad pin'; end if;
  delete from public.otoon_bubbles where true;
  delete from public.otoon_teams where true;
end $$;

create or replace function public.otoon_admin_set_pin(p_pin text, p_new text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.otoon_admin_check(p_pin) then raise exception 'bad pin'; end if;
  if char_length(p_new)<4 then raise exception 'pin too short'; end if;
  update public.otoon_admin set pin=p_new where id=1;
end $$;

revoke all on function public.otoon_save_bubble(int,int,int,text) from public;
revoke all on function public.otoon_save_team_name(int,text) from public;
revoke all on function public.otoon_admin_check(text) from public;
revoke all on function public.otoon_admin_config(text,text,int,int[],boolean,boolean) from public;
revoke all on function public.otoon_admin_reset(text) from public;
revoke all on function public.otoon_admin_set_pin(text,text) from public;
grant execute on function public.otoon_save_bubble(int,int,int,text) to anon, authenticated;
grant execute on function public.otoon_save_team_name(int,text) to anon, authenticated;
grant execute on function public.otoon_admin_check(text) to anon, authenticated;
grant execute on function public.otoon_admin_config(text,text,int,int[],boolean,boolean) to anon, authenticated;
grant execute on function public.otoon_admin_reset(text) to anon, authenticated;
grant execute on function public.otoon_admin_set_pin(text,text) to anon, authenticated;
