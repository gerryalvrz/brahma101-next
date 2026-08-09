-- Brahma101 personal site: blog, media, contacts, mailing list
-- Applied remotely via Supabase MCP (project brahma101)

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Blog posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_media_id uuid,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_slug_unique unique (slug)
);

create index posts_status_published_at_idx
  on public.posts (status, published_at desc);

create index posts_tags_gin_idx
  on public.posts using gin (tags);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Media metadata (files live in Storage)
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  filename text not null,
  mime_type text not null,
  kind text not null
    check (kind in ('image', 'pdf', 'other')),
  size_bytes bigint,
  width int,
  height int,
  alt_text text,
  title text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_bucket_path_unique unique (bucket, path)
);

create index media_assets_kind_idx on public.media_assets (kind);

alter table public.posts
  add constraint posts_cover_media_id_fkey
  foreign key (cover_media_id) references public.media_assets (id)
  on delete set null;

create index posts_cover_media_id_idx on public.posts (cover_media_id);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

create table public.post_media (
  post_id uuid not null references public.posts (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete cascade,
  sort_order int not null default 0,
  caption text,
  created_at timestamptz not null default now(),
  primary key (post_id, media_id)
);

create index post_media_media_id_idx on public.post_media (media_id);

-- Contacts (light CRM)
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  company text,
  role_title text,
  notes text,
  tags text[] not null default '{}',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_email_idx on public.contacts (lower(email));
create index contacts_phone_idx on public.contacts (phone);
create index contacts_tags_gin_idx on public.contacts using gin (tags);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Site contact form inbox
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  contact_id uuid references public.contacts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

create index contact_messages_contact_id_idx
  on public.contact_messages (contact_id);

-- Mailing list
create table public.mailing_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  phone text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'unsubscribed', 'bounced')),
  source text not null default 'website',
  contact_id uuid references public.contacts (id) on delete set null,
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mailing_subscribers_email_unique unique (email)
);

create index mailing_subscribers_status_idx
  on public.mailing_subscribers (status);

create index mailing_subscribers_contact_id_idx
  on public.mailing_subscribers (contact_id);

create trigger mailing_subscribers_set_updated_at
  before update on public.mailing_subscribers
  for each row execute function public.set_updated_at();

create table public.mailing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body_html text,
  body_text text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger mailing_campaigns_set_updated_at
  before update on public.mailing_campaigns
  for each row execute function public.set_updated_at();

create table public.mailing_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.mailing_campaigns (id) on delete cascade,
  subscriber_id uuid not null references public.mailing_subscribers (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mailing_sends_campaign_subscriber_unique unique (campaign_id, subscriber_id)
);

create index mailing_sends_campaign_status_idx
  on public.mailing_sends (campaign_id, status);

create index mailing_sends_subscriber_id_idx
  on public.mailing_sends (subscriber_id);

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'blog-images',
    'blog-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'documents',
    'documents',
    false,
    52428800,
    array['application/pdf']
  )
on conflict (id) do nothing;

-- RLS
alter table public.posts enable row level security;
alter table public.media_assets enable row level security;
alter table public.post_media enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_messages enable row level security;
alter table public.mailing_subscribers enable row level security;
alter table public.mailing_campaigns enable row level security;
alter table public.mailing_sends enable row level security;

create policy "Anon can read published posts"
  on public.posts for select
  to anon
  using (status = 'published');

create policy "Authenticated can manage posts"
  on public.posts for all
  to authenticated
  using (true)
  with check (true);

create policy "Anon can read public media"
  on public.media_assets for select
  to anon
  using (is_public = true);

create policy "Authenticated can manage media"
  on public.media_assets for all
  to authenticated
  using (true)
  with check (true);

create policy "Anon can read media for published posts"
  on public.post_media for select
  to anon
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

create policy "Authenticated can manage post media"
  on public.post_media for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can manage contacts"
  on public.contacts for all
  to authenticated
  using (true)
  with check (true);

create policy "Anon can submit contact messages"
  on public.contact_messages for insert
  to anon
  with check (true);

create policy "Authenticated can manage contact messages"
  on public.contact_messages for all
  to authenticated
  using (true)
  with check (true);

create policy "Anon can subscribe"
  on public.mailing_subscribers for insert
  to anon
  with check (status = 'pending');

create policy "Authenticated can manage subscribers"
  on public.mailing_subscribers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can manage campaigns"
  on public.mailing_campaigns for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can manage mailing sends"
  on public.mailing_sends for all
  to authenticated
  using (true)
  with check (true);

-- Storage policies
create policy "Public can read blog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

create policy "Authenticated can upload blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

create policy "Authenticated can update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');

create policy "Authenticated can delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');

create policy "Authenticated can read documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Authenticated can upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Authenticated can update documents"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');

create policy "Authenticated can delete documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents');
