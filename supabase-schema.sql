-- ============================================================
-- منصة رحلة تحول لإدارة المشاريع والمهام
-- شغّلي هذا الملف كاملًا داخل Supabase > SQL Editor > New query
-- ============================================================

-- تفعيل امتداد توليد UUID (غالبًا مفعّل مسبقًا في Supabase)
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- جدول الأعضاء
-- ------------------------------------------------------------
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- جدول المشاريع
-- ------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  owner_id uuid references members(id) on delete set null,
  priority text not null check (priority in ('high','medium','low')),
  status text not null default 'todo' check (status in ('todo','build','test','done')),
  start_date date,
  due_date date,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- جدول المهام
-- ------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  assignee_id uuid references members(id) on delete set null,
  status text not null default 'todo' check (status in ('todo','build','test','done')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- الأعضاء الأساسيون (يمكن إضافة المزيد لاحقًا من داخل التطبيق)
-- ------------------------------------------------------------
insert into members (name) values
  ('هناء صديق'),
  ('نوف ناس'),
  ('سارة آل عامر'),
  ('د. مصطفى عرقسوس')
on conflict do nothing;

-- ------------------------------------------------------------
-- تفعيل الوصول العام (بدون تسجيل دخول، حسب متطلبات المشروع)
-- ملاحظة: هذا يجعل البيانات قابلة للقراءة والتعديل من أي شخص يملك
-- رابط الموقع، وهو ما تم الاتفاق عليه (لا صلاحيات متفاوتة).
-- ------------------------------------------------------------
alter table members enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;

create policy "public_full_access_members" on members
  for all using (true) with check (true);

create policy "public_full_access_projects" on projects
  for all using (true) with check (true);

create policy "public_full_access_tasks" on tasks
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- تفعيل التحديثات اللحظية (Realtime) على المشاريع والمهام
-- ------------------------------------------------------------
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
