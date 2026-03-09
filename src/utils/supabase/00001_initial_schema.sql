-- ============================================================================
-- PROPERTY MANAGEMENT SaaS — Initial Schema
-- Target: Supabase (PostgreSQL 15+)
-- Focus: Greek κοινόχρηστα management
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- How a shared expense gets split across units
create type expense_split_method as enum (
  'millesimal',    -- by χιλιοστά (most common in Greece)
  'equal',         -- equal split across all units
  'per_sqm',       -- by square meters
  'custom',        -- manager assigns arbitrary percentages
  'fixed'          -- fixed amount per unit (e.g. parking)
);

create type payment_status as enum (
  'pending',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'refunded'
);

create type payment_method as enum (
  'card',
  'bank_transfer',
  'cash',
  'iris',          -- Greek instant payment system
  'other'
);

create type unit_type as enum (
  'apartment',
  'studio',
  'office',
  'shop',
  'parking',
  'storage',
  'other'
);

create type user_role as enum (
  'owner',         -- owns the organization
  'manager',       -- can manage buildings, expenses, tenants
  'viewer'         -- read-only access (e.g. accountant)
);

create type tenant_role as enum (
  'owner',         -- ιδιοκτήτης
  'renter',        -- ενοικιαστής
  'occupant'       -- other (e.g. family member listed as contact)
);

create type expense_status as enum (
  'draft',
  'approved',
  'billed',        -- bills have been generated from this expense
  'cancelled'
);

create type billing_period_status as enum (
  'draft',         -- still adding expenses
  'finalized',     -- locked, bills generated
  'closed'         -- all payments collected (or written off)
);

create type announcement_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type maintenance_status as enum (
  'submitted',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed',
  'cancelled'
);


-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2.1 Organizations (the property management company / individual manager)
-- This is the top-level multi-tenancy boundary.
create table organizations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  tax_id        text,                -- ΑΦΜ
  tax_office    text,                -- ΔΟΥ
  email         text,
  phone         text,
  address       text,
  city          text,
  postal_code   text,
  logo_url      text,
  settings      jsonb default '{}'::jsonb,  -- org-level prefs (currency, language, etc.)
  stripe_customer_id    text,               -- for SaaS billing (the manager pays us)
  stripe_subscription_id text,
  subscription_plan     text default 'free',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2.2 Organization members (links auth.users → organizations)
create table organization_members (
  id            uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          user_role not null default 'manager',
  invited_email text,                -- set when invited, cleared on acceptance
  accepted_at   timestamptz,
  created_at    timestamptz default now(),

  unique(organization_id, user_id)
);

-- 2.3 Buildings
create table buildings (
  id            uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name          text not null,       -- e.g. "Λεωφ. Συγγρού 42"
  address       text,
  city          text default 'Αθήνα',
  postal_code   text,
  year_built    int,
  total_units   int,                 -- cached count, updated via trigger
  total_millesimal int default 1000, -- total χιλιοστά (typically 1000)
  floors        int,
  has_elevator  boolean default false,
  has_central_heating boolean default false,
  has_parking   boolean default false,
  notes         text,
  settings      jsonb default '{}'::jsonb,  -- building-specific overrides
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_buildings_org on buildings(organization_id);

-- 2.4 Units (apartments, shops, parking spots, etc.)
create table units (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references buildings(id) on delete cascade,
  unit_label    text not null,        -- e.g. "3Α", "Ισόγειο Δ1", "Parking 5"
  floor         int,
  unit_type     unit_type default 'apartment',
  area_sqm      numeric(8,2),         -- τετραγωνικά μέτρα
  millesimal    numeric(8,3) not null, -- χιλιοστά (e.g. 85.500)
  has_parking   boolean default false,
  has_storage   boolean default false,
  is_occupied   boolean default true,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  unique(building_id, unit_label)
);

create index idx_units_building on units(building_id);

-- 2.5 Tenants / Owners (people associated with units)
-- A person can be linked to multiple units, and a unit can have multiple people.
create table tenants (
  id            uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null, -- linked if they have a portal account
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  tax_id        text,                -- ΑΦΜ (needed for owners)
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_tenants_org on tenants(organization_id);
create index idx_tenants_user on tenants(user_id);

-- 2.6 Unit ↔ Tenant link (many-to-many with role context)
create table unit_tenants (
  id            uuid primary key default uuid_generate_v4(),
  unit_id       uuid not null references units(id) on delete cascade,
  tenant_id     uuid not null references tenants(id) on delete cascade,
  role          tenant_role not null default 'renter',
  is_primary_contact boolean default false,  -- who gets the bills
  move_in_date  date,
  move_out_date date,
  created_at    timestamptz default now(),

  unique(unit_id, tenant_id)
);

create index idx_unit_tenants_unit on unit_tenants(unit_id);
create index idx_unit_tenants_tenant on unit_tenants(tenant_id);


-- ============================================================================
-- 3. BILLING & EXPENSES
-- ============================================================================

-- 3.1 Billing periods (monthly cycles)
create table billing_periods (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references buildings(id) on delete cascade,
  label         text not null,        -- e.g. "Μάρτιος 2026"
  start_date    date not null,
  end_date      date not null,
  status        billing_period_status default 'draft',
  finalized_at  timestamptz,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  unique(building_id, start_date, end_date)
);

create index idx_billing_periods_building on billing_periods(building_id);

-- 3.2 Expense categories (customizable per organization)
create table expense_categories (
  id            uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name          text not null,        -- e.g. "Ηλεκτρικό κοινοχρήστων", "Καθαρισμός"
  description   text,
  default_split_method expense_split_method default 'millesimal',
  icon          text,                 -- optional icon identifier
  sort_order    int default 0,
  is_system     boolean default false, -- true = seeded defaults, can't be deleted
  created_at    timestamptz default now()
);

create index idx_expense_categories_org on expense_categories(organization_id);

-- 3.3 Expenses (individual line items within a billing period)
create table expenses (
  id               uuid primary key default uuid_generate_v4(),
  billing_period_id uuid not null references billing_periods(id) on delete cascade,
  category_id      uuid references expense_categories(id) on delete set null,
  description      text not null,     -- e.g. "ΔΕΗ Φεβρουάριος"
  amount           numeric(12,2) not null,
  split_method     expense_split_method not null default 'millesimal',
  status           expense_status default 'draft',
  receipt_url      text,              -- link to uploaded receipt in R2/Supabase Storage
  vendor_name      text,
  invoice_number   text,
  expense_date     date,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index idx_expenses_period on expenses(billing_period_id);

-- 3.4 Expense overrides (for 'custom' split — per-unit amounts)
-- Only used when split_method = 'custom'
create table expense_unit_overrides (
  id            uuid primary key default uuid_generate_v4(),
  expense_id    uuid not null references expenses(id) on delete cascade,
  unit_id       uuid not null references units(id) on delete cascade,
  amount        numeric(12,2) not null, -- the exact amount this unit pays
  created_at    timestamptz default now(),

  unique(expense_id, unit_id)
);

-- 3.5 Bills (the computed charge per unit per billing period)
-- Generated when a billing period is finalized.
create table bills (
  id               uuid primary key default uuid_generate_v4(),
  billing_period_id uuid not null references billing_periods(id) on delete cascade,
  unit_id          uuid not null references units(id) on delete cascade,
  tenant_id        uuid references tenants(id) on delete set null, -- primary contact at time of billing
  total_amount     numeric(12,2) not null,
  amount_paid      numeric(12,2) default 0,
  status           payment_status default 'pending',
  due_date         date,
  issued_at        timestamptz default now(),
  paid_at          timestamptz,
  payment_link_token text unique,     -- unique token for the "pay now" link
  pdf_url          text,              -- generated PDF of the κοινόχρηστα breakdown
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),

  unique(billing_period_id, unit_id)
);

create index idx_bills_unit on bills(unit_id);
create index idx_bills_tenant on bills(tenant_id);
create index idx_bills_status on bills(status);
create index idx_bills_payment_token on bills(payment_link_token);

-- 3.6 Bill line items (breakdown showing each expense's contribution to this bill)
create table bill_line_items (
  id            uuid primary key default uuid_generate_v4(),
  bill_id       uuid not null references bills(id) on delete cascade,
  expense_id    uuid not null references expenses(id) on delete cascade,
  amount        numeric(12,2) not null, -- this unit's share of this expense
  created_at    timestamptz default now()
);

create index idx_bill_lines_bill on bill_line_items(bill_id);

-- 3.7 Payments (actual money received)
create table payments (
  id            uuid primary key default uuid_generate_v4(),
  bill_id       uuid not null references bills(id) on delete cascade,
  amount        numeric(12,2) not null,
  method        payment_method not null,
  reference     text,                 -- Stripe payment intent ID, bank ref, etc.
  paid_at       timestamptz default now(),
  recorded_by   uuid references auth.users(id),  -- who recorded it (for cash)
  notes         text,
  created_at    timestamptz default now()
);

create index idx_payments_bill on payments(bill_id);


-- ============================================================================
-- 4. SECONDARY FEATURES
-- ============================================================================

-- 4.1 Announcements (building-wide notices)
create table announcements (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references buildings(id) on delete cascade,
  author_id     uuid references auth.users(id),
  title         text not null,
  body          text not null,
  priority      announcement_priority default 'normal',
  is_pinned     boolean default false,
  published_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_announcements_building on announcements(building_id);

-- 4.2 Maintenance requests
create table maintenance_requests (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references buildings(id) on delete cascade,
  unit_id       uuid references units(id) on delete set null,  -- null = common area
  submitted_by  uuid references tenants(id),
  title         text not null,
  description   text,
  status        maintenance_status default 'submitted',
  priority      announcement_priority default 'normal',
  resolved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_maintenance_building on maintenance_requests(building_id);

-- 4.3 Documents (contracts, insurance, minutes, etc.)
create table documents (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references buildings(id) on delete cascade,
  uploaded_by   uuid references auth.users(id),
  name          text not null,
  file_url      text not null,
  file_size     int,
  mime_type     text,
  category      text,                 -- 'contract', 'insurance', 'minutes', 'other'
  notes         text,
  created_at    timestamptz default now()
);

create index idx_documents_building on documents(building_id);


-- ============================================================================
-- 5. AUDIT LOG
-- ============================================================================
create table audit_log (
  id            uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete set null,
  user_id       uuid references auth.users(id) on delete set null,
  action        text not null,        -- e.g. 'bill.created', 'payment.recorded', 'expense.deleted'
  entity_type   text,                 -- e.g. 'bill', 'payment', 'expense'
  entity_id     uuid,
  metadata      jsonb default '{}'::jsonb,  -- old/new values, context
  ip_address    inet,
  created_at    timestamptz default now()
);

create index idx_audit_org on audit_log(organization_id);
create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_created on audit_log(created_at);


-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Get the current user's organization ID (used in RLS policies)
create or replace function current_user_organization_id()
returns uuid as $$
  select om.organization_id
  from organization_members om
  where om.user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to all relevant tables
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'organizations', 'buildings', 'units', 'tenants',
      'billing_periods', 'expenses', 'bills',
      'announcements', 'maintenance_requests'
    ])
  loop
    execute format(
      'create trigger set_updated_at before update on %I
       for each row execute function update_updated_at()',
      t
    );
  end loop;
end;
$$;


-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'organizations', 'organization_members', 'buildings', 'units',
      'tenants', 'unit_tenants', 'billing_periods', 'expense_categories',
      'expenses', 'expense_unit_overrides', 'bills', 'bill_line_items',
      'payments', 'announcements', 'maintenance_requests', 'documents',
      'audit_log'
    ])
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end;
$$;

-- --------------------------------------------------------
-- POLICY: Organization members can see their own organization
-- --------------------------------------------------------
create policy "Users see own org"
  on organizations for select
  using (id in (
    select organization_id from organization_members where user_id = auth.uid()
  ));

create policy "Owners can update org"
  on organizations for update
  using (id in (
    select organization_id from organization_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- --------------------------------------------------------
-- POLICY: Organization members
-- --------------------------------------------------------
create policy "Members see own org members"
  on organization_members for select
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid()
  ));

-- --------------------------------------------------------
-- POLICY: Buildings — scoped to organization
-- --------------------------------------------------------
create policy "Org members see buildings"
  on buildings for select
  using (organization_id = current_user_organization_id());

create policy "Managers can insert buildings"
  on buildings for insert
  with check (organization_id = current_user_organization_id());

create policy "Managers can update buildings"
  on buildings for update
  using (organization_id = current_user_organization_id());

create policy "Managers can delete buildings"
  on buildings for delete
  using (organization_id = current_user_organization_id());

-- --------------------------------------------------------
-- POLICY: Units — via building → organization
-- --------------------------------------------------------
create policy "Org members see units"
  on units for select
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

create policy "Managers can insert units"
  on units for insert
  with check (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

create policy "Managers can update units"
  on units for update
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

create policy "Managers can delete units"
  on units for delete
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

-- --------------------------------------------------------
-- POLICY: Tenants — scoped to organization
-- --------------------------------------------------------
create policy "Org members see tenants"
  on tenants for select
  using (organization_id = current_user_organization_id());

create policy "Managers can insert tenants"
  on tenants for insert
  with check (organization_id = current_user_organization_id());

create policy "Managers can update tenants"
  on tenants for update
  using (organization_id = current_user_organization_id());

-- --------------------------------------------------------
-- POLICY: Tenants can see their own bills
-- --------------------------------------------------------
create policy "Tenants see own bills"
  on bills for select
  using (
    tenant_id in (
      select id from tenants where user_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- POLICY: Managers see all bills for their org's buildings
-- --------------------------------------------------------
create policy "Managers see org bills"
  on bills for select
  using (
    billing_period_id in (
      select bp.id from billing_periods bp
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

create policy "Managers can insert bills"
  on bills for insert
  with check (
    billing_period_id in (
      select bp.id from billing_periods bp
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

create policy "Managers can update bills"
  on bills for update
  using (
    billing_period_id in (
      select bp.id from billing_periods bp
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

-- --------------------------------------------------------
-- POLICY: Billing periods — via building → organization
-- --------------------------------------------------------
create policy "Org members see billing periods"
  on billing_periods for select
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

create policy "Managers can manage billing periods"
  on billing_periods for all
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

-- --------------------------------------------------------
-- POLICY: Expenses — via billing_period → building → org
-- --------------------------------------------------------
create policy "Org members see expenses"
  on expenses for select
  using (
    billing_period_id in (
      select bp.id from billing_periods bp
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

create policy "Managers can manage expenses"
  on expenses for all
  using (
    billing_period_id in (
      select bp.id from billing_periods bp
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

-- --------------------------------------------------------
-- POLICY: Payments — via bill → billing_period → building → org
-- --------------------------------------------------------
create policy "Org members see payments"
  on payments for select
  using (
    bill_id in (
      select bi.id from bills bi
      join billing_periods bp on bp.id = bi.billing_period_id
      join buildings b on b.id = bp.building_id
      where b.organization_id = current_user_organization_id()
    )
  );

-- Similar for insert/update — omitted for brevity, follow same pattern.

-- --------------------------------------------------------
-- POLICY: Expense categories — per organization
-- --------------------------------------------------------
create policy "Org members see categories"
  on expense_categories for select
  using (organization_id = current_user_organization_id());

create policy "Managers can manage categories"
  on expense_categories for all
  using (organization_id = current_user_organization_id());

-- --------------------------------------------------------
-- POLICY: Announcements — via building
-- --------------------------------------------------------
create policy "See building announcements"
  on announcements for select
  using (building_id in (
    select id from buildings where organization_id = current_user_organization_id()
  ));

-- --------------------------------------------------------
-- POLICY: Audit log — org scoped, read-only for members
-- --------------------------------------------------------
create policy "Org members see audit log"
  on audit_log for select
  using (organization_id = current_user_organization_id());


-- ============================================================================
-- 8. SEED DATA — Default expense categories (Greek)
-- ============================================================================

-- This runs per-organization via a function called on org creation.
create or replace function seed_default_categories(org_id uuid)
returns void as $$
begin
  insert into expense_categories (organization_id, name, default_split_method, sort_order, is_system) values
    (org_id, 'Ηλεκτρικό κοινοχρήστων',     'millesimal', 1,  true),
    (org_id, 'Νερό κοινόχρηστο',            'millesimal', 2,  true),
    (org_id, 'Θέρμανση',                     'millesimal', 3,  true),
    (org_id, 'Ασανσέρ — Συντήρηση',         'millesimal', 4,  true),
    (org_id, 'Ασανσέρ — Ηλεκτρικό',         'millesimal', 5,  true),
    (org_id, 'Καθαρισμός',                   'millesimal', 6,  true),
    (org_id, 'Κηπουρός',                     'millesimal', 7,  true),
    (org_id, 'Αποχέτευση',                   'millesimal', 8,  true),
    (org_id, 'Ασφάλεια κτιρίου',            'millesimal', 9,  true),
    (org_id, 'Αμοιβή διαχειριστή',          'millesimal', 10, true),
    (org_id, 'Κοινόχρηστα έξοδα — Λοιπά',   'millesimal', 11, true),
    (org_id, 'Επισκευές / Συντηρήσεις',     'millesimal', 12, true),
    (org_id, 'Αποθεματικό',                  'millesimal', 13, true);
end;
$$ language plpgsql;


-- ============================================================================
-- 9. KEY BUSINESS LOGIC — Bill calculation
-- ============================================================================

-- Calculate each unit's share for a given expense based on its split method.
-- This is called when finalizing a billing period.
create or replace function calculate_bill_for_period(p_billing_period_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_building_id uuid;
  v_total_millesimal numeric;
  v_total_sqm numeric;
  v_unit_count int;
  exp record;
  unit record;
  v_bill_id uuid;
  v_share numeric;
begin
  -- Get building info
  select bp.building_id into v_building_id
  from billing_periods bp where bp.id = p_billing_period_id;

  select b.total_millesimal into v_total_millesimal
  from buildings b where b.id = v_building_id;

  select count(*) into v_unit_count
  from units u where u.building_id = v_building_id;

  select coalesce(sum(u.area_sqm), 1) into v_total_sqm
  from units u where u.building_id = v_building_id and u.area_sqm is not null;

  -- Create a bill for each unit (if not already existing)
  for unit in
    select u.id as unit_id, u.millesimal, u.area_sqm,
           (select ut.tenant_id from unit_tenants ut
            where ut.unit_id = u.id and ut.is_primary_contact = true
            limit 1) as primary_tenant_id
    from units u where u.building_id = v_building_id
  loop
    -- Upsert bill
    insert into bills (billing_period_id, unit_id, tenant_id, total_amount, due_date, payment_link_token)
    values (
      p_billing_period_id,
      unit.unit_id,
      unit.primary_tenant_id,
      0,
      (select end_date + interval '15 days' from billing_periods where id = p_billing_period_id),
      encode(gen_random_bytes(16), 'hex')
    )
    on conflict (billing_period_id, unit_id)
    do update set total_amount = 0, updated_at = now()
    returning id into v_bill_id;

    -- Delete old line items if recalculating
    delete from bill_line_items where bill_id = v_bill_id;

    -- Calculate each expense's share for this unit
    for exp in
      select e.id, e.amount, e.split_method
      from expenses e
      where e.billing_period_id = p_billing_period_id
        and e.status in ('approved', 'billed')
    loop
      -- Determine this unit's share
      case exp.split_method
        when 'millesimal' then
          v_share := round(exp.amount * (unit.millesimal / v_total_millesimal), 2);
        when 'equal' then
          v_share := round(exp.amount / v_unit_count, 2);
        when 'per_sqm' then
          v_share := round(exp.amount * (coalesce(unit.area_sqm, 0) / v_total_sqm), 2);
        when 'custom' then
          select coalesce(o.amount, 0) into v_share
          from expense_unit_overrides o
          where o.expense_id = exp.id and o.unit_id = unit.unit_id;
        when 'fixed' then
          select coalesce(o.amount, 0) into v_share
          from expense_unit_overrides o
          where o.expense_id = exp.id and o.unit_id = unit.unit_id;
        else
          v_share := 0;
      end case;

      -- Insert line item
      insert into bill_line_items (bill_id, expense_id, amount)
      values (v_bill_id, exp.id, v_share);
    end loop;

    -- Update bill total
    update bills set total_amount = (
      select coalesce(sum(amount), 0) from bill_line_items where bill_id = v_bill_id
    ) where id = v_bill_id;

  end loop;
end;
$$ language plpgsql;

-- Function to automatically recalculate bill totals and status
create or replace function update_bill_payment_status()
returns trigger
language plpgsql
security definer
as $$
declare
  v_bill_id uuid;
  v_total_paid numeric;
  v_bill_total numeric;
  v_due_date date;
  v_new_status payment_status;
begin
  -- 1. Get the relevant bill_id depending on the action (Delete vs Insert/Update)
  if TG_OP = 'DELETE' then
    v_bill_id := OLD.bill_id;
  else
    v_bill_id := NEW.bill_id;
  end if;

  -- 2. Calculate the total money actually paid towards this bill
  select coalesce(sum(amount), 0) into v_total_paid
  from payments
  where bill_id = v_bill_id;

  -- 3. Get the bill's total amount and due date for comparison
  select total_amount, due_date into v_bill_total, v_due_date
  from bills
  where id = v_bill_id;

  -- 4. Determine the precise status
  if v_total_paid >= v_bill_total then
    v_new_status := 'paid'::payment_status;
  elsif v_total_paid > 0 then
    v_new_status := 'partially_paid'::payment_status;
  else
    -- If nothing is paid, check if it's past the due date
    if v_due_date < current_date then
      v_new_status := 'overdue'::payment_status;
    else
      v_new_status := 'pending'::payment_status;
    end if;
  end if;

  -- 5. Update the parent bill with the new data
  update bills
  set 
    amount_paid = v_total_paid,
    status = v_new_status,
    paid_at = case when v_new_status = 'paid' then now() else null end,
    updated_at = now()
  where id = v_bill_id;

  return null; 
end;
$$;

-- Attach the trigger to the payments table
create trigger trg_update_bill_on_payment
after insert or update or delete on payments
for each row
execute function update_bill_payment_status();

-- ============================================================================
-- Separate function to finalize a billing period (called after bills are
-- generated and reviewed). This locks the period and marks expenses as billed.
-- Usage: SELECT finalize_billing_period('period-uuid');
-- ============================================================================
create or replace function finalize_billing_period(p_billing_period_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify the period exists and has bills
  if not exists (
    select 1 from bills where billing_period_id = p_billing_period_id
  ) then
    raise exception 'Cannot finalize: no bills found for this period. Run calculate_bill_for_period() first.';
  end if;

  -- Verify the period is not already finalized
  if exists (
    select 1 from billing_periods where id = p_billing_period_id and status = 'finalized'
  ) then
    raise exception 'This billing period is already finalized.';
  end if;

  -- Mark period as finalized
  update billing_periods
  set status = 'finalized', finalized_at = now(), updated_at = now()
  where id = p_billing_period_id;

  -- Mark expenses as billed
  update expenses
  set status = 'billed', updated_at = now()
  where billing_period_id = p_billing_period_id and status = 'approved';
end;
$$;

-- ============================================================================
-- 10. USEFUL VIEWS
-- ============================================================================

-- Building summary: quick stats per building
create or replace view building_summary as
select
  b.id as building_id,
  b.name,
  b.organization_id,
  count(distinct u.id) as unit_count,
  count(distinct ut.tenant_id) as tenant_count,
  (
    select coalesce(sum(bi.total_amount), 0)
    from bills bi
    join billing_periods bp on bp.id = bi.billing_period_id
    where bp.building_id = b.id and bi.status = 'pending'
  ) as total_outstanding,
  (
    select coalesce(sum(bi.total_amount), 0)
    from bills bi
    join billing_periods bp on bp.id = bi.billing_period_id
    where bp.building_id = b.id and bi.status = 'overdue'
  ) as total_overdue
from buildings b
left join units u on u.building_id = b.id
left join unit_tenants ut on ut.unit_id = u.id and ut.move_out_date is null
group by b.id, b.name, b.organization_id;

-- Tenant balance view: what each tenant currently owes
create or replace view tenant_balance as
select
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  t.organization_id,
  coalesce(sum(bi.total_amount - bi.amount_paid) filter (where bi.status in ('pending', 'overdue', 'partially_paid')), 0) as balance_due,
  count(*) filter (where bi.status = 'overdue') as overdue_bills
from tenants t
left join bills bi on bi.tenant_id = t.id
group by t.id, t.first_name, t.last_name, t.organization_id;


-- ============================================================================
-- DONE. Next steps:
-- 1. Run: supabase db push (to apply migrations)
-- 2. Create your first organization via the app's onboarding flow
-- 3. Seed default categories: select seed_default_categories('your-org-uuid');
-- 4. Add buildings, units, tenants
-- 5. Create a billing period, add expenses, finalize → bills auto-generated
-- ============================================================================
