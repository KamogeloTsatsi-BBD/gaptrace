create type criterion_status as enum ('full', 'partial', 'missing', 'needs_review');

create type gap_category as enum (
  'error_handling',
  'edge_cases',
  'permissions',
  'validation',
  'data_integrity',
  'performance',
  'ui_ux',
  'other'
);

-- ── analyses ─────────────────────────────────────────────────────────────
create table analyses (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  requirement_text text not null,
  pr_reference     text,
  scope            jsonb not null,

  constraint analyses_id_user_key unique (id, user_id)
);


create index analyses_user_created_idx on analyses (user_id, id desc);

-- ── criteria ─────────────────────────────────────────────────────────────
create table criteria (
  id            bigint generated always as identity primary key,
  analysis_id   bigint not null,

  user_id       uuid not null,

  criterion_key text not null,

  position      int not null,

  text          text not null,
  verifiable    boolean not null,

  status        criterion_status not null,
  reason        text not null,
  confidence    real not null,
  category      gap_category,
  evidence      jsonb,

  constraint criteria_parent_fk
    foreign key (analysis_id, user_id)
    references analyses (id, user_id)
    on delete cascade,

  constraint criteria_unique_key      unique (analysis_id, criterion_key),
  constraint criteria_unique_position unique (analysis_id, position),

  constraint criteria_confidence_range
    check (confidence >= 0 and confidence <= 1),


  constraint criteria_category_matches_status check (
    (status in ('partial', 'missing')   and category is not null) or
    (status in ('full', 'needs_review') and category is null)
  )
);


create index criteria_analysis_idx on criteria (analysis_id);


create index criteria_gap_idx
  on criteria (category, status)
  where status in ('partial', 'missing');


create table insight_snapshots (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  substrate_key  text not null,

  cards          jsonb not null,
  generated_at   timestamptz not null default now(),
  analysis_count int not null
);


alter table analyses          enable row level security;
alter table criteria          enable row level security;
alter table insight_snapshots enable row level security;

create policy analyses_owner on analyses
  for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy criteria_owner on criteria
  for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy insight_snapshots_owner on insight_snapshots
  for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function save_analysis(draft jsonb)
returns table (id bigint, created_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id      bigint;
  new_created timestamptz;
  owner       uuid := (select auth.uid());
begin
  if owner is null then
    raise exception 'save_analysis requires an authenticated caller';
  end if;

  insert into public.analyses (user_id, requirement_text, pr_reference, scope)
  values (
    owner,
    draft ->> 'requirementText',
    draft ->> 'prReference',
    draft -> 'scope'
  )
  returning analyses.id, analyses.created_at
  into new_id, new_created;

  insert into public.criteria (
    analysis_id, user_id, criterion_key, position, text, verifiable,
    status, reason, confidence, category, evidence
  )
  select
    new_id,
    owner,
    c ->> 'id',
    ordinality - 1,
    c ->> 'text',
    (c ->> 'verifiable')::boolean,
    (c ->> 'status')::public.criterion_status,
    c ->> 'reason',
    (c ->> 'confidence')::real,
    (c ->> 'category')::public.gap_category,   -- SQL NULL when the key is JSON null
    case when c -> 'evidence' = '"none"'::jsonb then null else c -> 'evidence' end
  from jsonb_array_elements(draft -> 'criteria') with ordinality as t(c, ordinality);

  return query select new_id, new_created;
end;
$$;
