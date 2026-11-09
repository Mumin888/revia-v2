-- ═════════════════════════════════════════════════════════════════════
--  REVIA — database security hardening
--
--  NOT applied automatically, and written without access to the live
--  database: read it, then run it in the Supabase SQL editor.
--  It is one transaction, so any error rolls every change back.
--
--  What it enforces (the app code cannot do these on its own):
--    1. Usernames are unique, ignoring case.
--    2. `profiles.role` can only be changed from this editor or with the
--       service-role key, never by a signed-in browser.
--    3. A review always belongs to whoever is signed in: the database
--       stamps `user_id` and `user_name` itself and ignores what was sent.
--    4. Signed-out visitors can read nothing. Members can read everything
--       but only write their own rows.
--    5. Nobody reads another member's e-mail through the API.
--
--  BEFORE running:
--    a. Add SUPABASE_SERVICE_ROLE_KEY to the app's environment (hosting
--       dashboard and .env.local). After step 5, signing in by username
--       and the e-mail column on /admin need it. E-mail sign-in does not.
--    b. Make yourself an admin. /admin now trusts only this column:
--
--         update public.profiles set role = 'admin'
--          where id = (select id from auth.users where email = 'you@example.com');
--
--    c. Check for names that differ only by case; step 1 fails on them:
--
--         select lower(username), count(*) from public.profiles
--          group by 1 having count(*) > 1;
--
--    d. Look at the policies you have today; step 4 REPLACES them:
--
--         select tablename, policyname, cmd, roles, qual, with_check
--           from pg_policies where schemaname = 'public';
-- ═════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Unique usernames ──────────────────────────────────────────────
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Accounts that never got a profile row get one now, so step 3 does not
-- lock them out. A name that is already taken is skipped.
insert into public.profiles (id, email, username, role)
select u.id,
       u.email,
       coalesce(nullif(btrim(u.raw_user_meta_data ->> 'username'), ''), split_part(u.email, '@', 1)),
       'user'
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;

-- New accounts get their profile row from the database, whether or not
-- the browser manages to write one. A taken username fails the sign-up.
create or replace function public.revia_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists revia_on_auth_user_created on auth.users;
create trigger revia_on_auth_user_created
  after insert on auth.users
  for each row execute function public.revia_handle_new_user();

-- ── 2. Role cannot be set or changed by a browser ────────────────────
-- Requests through the API carry a JWT whose role is `anon` or
-- `authenticated`. The SQL editor and the service-role key do not.
create or replace function public.revia_protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.role := 'user';
    else
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists revia_protect_profile_role on public.profiles;
create trigger revia_protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.revia_protect_profile_role();

-- ── 3. Reviews belong to the signed-in member ────────────────────────
-- Old rows saved with a name but no id are linked to the matching profile.
update public.media_reviews r
   set user_id = p.id
  from public.profiles p
 where r.user_id is null
   and lower(r.user_name) = lower(p.username);

create or replace function public.revia_stamp_review_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_name text;
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'authenticated' then
    select username into owner_name from public.profiles where id = auth.uid();
    if owner_name is null then
      raise exception 'A profile with a username is required to save a review';
    end if;
    new.user_id   := auth.uid();
    new.user_name := owner_name;
  end if;
  return new;
end;
$$;

drop trigger if exists revia_stamp_review_owner on public.media_reviews;
create trigger revia_stamp_review_owner
  before insert or update on public.media_reviews
  for each row execute function public.revia_stamp_review_owner();

-- ── 4. Row level security: one known set of policies ─────────────────
alter table public.profiles      enable row level security;
alter table public.media_items   enable row level security;
alter table public.media_reviews enable row level security;

-- Policies are combined with OR, so an old permissive one would undo the
-- new ones. Every existing policy on these three tables is removed first.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
      from pg_policies
     where schemaname = 'public'
       and tablename in ('profiles', 'media_items', 'media_reviews')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

create policy profiles_read on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- The shared catalogue: members read it and add titles; nobody edits or
-- deletes titles through the API (the app never does).
create policy media_items_read on public.media_items
  for select to authenticated using (true);
create policy media_items_insert on public.media_items
  for insert to authenticated with check (true);

create policy media_reviews_read on public.media_reviews
  for select to authenticated using (true);
create policy media_reviews_insert_own on public.media_reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy media_reviews_update_own on public.media_reviews
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy media_reviews_delete_own on public.media_reviews
  for delete to authenticated using (user_id = auth.uid());

-- ── 5. E-mail addresses are not readable through the API ─────────────
-- Row level security cannot hide a single column, so the column list a
-- member may select is narrowed instead. The app reads the signed-in
-- member's own e-mail from the auth session, not from this table.
revoke all    on public.profiles from anon;
revoke select on public.profiles from authenticated;
grant  select (id, username, role, avatar_url, created_at)
  on public.profiles to authenticated;

-- The sign-up form asks whether a name is free. Answers yes/no only.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(btrim(candidate))
  );
$$;

revoke all     on function public.is_username_available(text) from public;
grant  execute on function public.is_username_available(text) to anon, authenticated;

commit;
