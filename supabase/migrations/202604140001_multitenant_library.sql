create extension if not exists pgcrypto;

create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  city text,
  accent text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.librarian_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.librarian_libraries (
  librarian_id uuid not null references auth.users(id) on delete cascade,
  library_id uuid not null references public.libraries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (librarian_id, library_id)
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  title text not null,
  author text not null,
  category text not null,
  total_copies integer not null check (total_copies >= 0),
  available_copies integer not null check (available_copies >= 0 and available_copies <= total_copies),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.loan_status as enum ('pending', 'approved', 'handled', 'returned', 'rejected');

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  full_name text not null,
  identifier text not null,
  requested_copies integer not null check (requested_copies >= 1),
  status public.loan_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_at timestamptz,
  returned_at timestamptz
);

create table if not exists public.loan_request_events (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  identifier text not null,
  book_id uuid not null references public.books(id) on delete cascade,
  request_ip inet not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_touch_updated_at on public.books;
create trigger books_touch_updated_at
before update on public.books
for each row
execute procedure public.touch_updated_at();

drop trigger if exists loans_touch_updated_at on public.loans;
create trigger loans_touch_updated_at
before update on public.loans
for each row
execute procedure public.touch_updated_at();

create or replace function public.create_public_loan_request(
  p_library_id uuid,
  p_book_id uuid,
  p_full_name text,
  p_identifier text,
  p_requested_copies integer,
  p_request_ip inet
)
returns setof public.loans
language plpgsql
security definer
as $$
declare
  v_book public.books;
  v_count integer;
  v_duplicate integer;
  v_loan public.loans;
begin
  if trim(coalesce(p_full_name, '')) = '' or trim(coalesce(p_identifier, '')) = '' then
    raise exception 'Required fields cannot be empty';
  end if;

  if p_requested_copies < 1 then
    raise exception 'requested_copies must be at least 1';
  end if;

  select count(*)
  into v_count
  from public.loan_request_events
  where request_ip = p_request_ip
    and created_at >= now() - interval '1 minute';

  if v_count >= 5 then
    raise exception 'Rate limit exceeded for this IP';
  end if;

  select count(*)
  into v_duplicate
  from public.loans
  where library_id = p_library_id
    and book_id = p_book_id
    and lower(identifier) = lower(p_identifier)
    and created_at >= now() - interval '10 minutes';

  if v_duplicate > 0 then
    raise exception 'Duplicate loan request detected';
  end if;

  select *
  into v_book
  from public.books
  where id = p_book_id
    and library_id = p_library_id
  for update;

  if not found then
    raise exception 'Book not found for this library';
  end if;

  if v_book.available_copies < p_requested_copies then
    raise exception 'Requested copies exceed available inventory';
  end if;

  insert into public.loan_request_events (library_id, identifier, book_id, request_ip)
  values (p_library_id, p_identifier, p_book_id, p_request_ip);

  insert into public.loans (library_id, book_id, full_name, identifier, requested_copies)
  values (p_library_id, p_book_id, p_full_name, p_identifier, p_requested_copies)
  returning * into v_loan;

  return query select * from public.loans where id = v_loan.id;
end;
$$;

create or replace function public.transition_loan_status(
  p_loan_id uuid,
  p_next_status public.loan_status,
  p_librarian_id uuid
)
returns setof public.loans
language plpgsql
security definer
as $$
declare
  v_loan public.loans;
  v_book public.books;
begin
  if not exists (
    select 1
    from public.librarian_libraries ll
    join public.loans l on l.library_id = ll.library_id
    where ll.librarian_id = p_librarian_id
      and l.id = p_loan_id
  ) then
    raise exception 'Librarian is not assigned to this library';
  end if;

  select *
  into v_loan
  from public.loans
  where id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

  select *
  into v_book
  from public.books
  where id = v_loan.book_id
  for update;

  if p_next_status = 'handled' then
    if v_loan.status <> 'approved' then
      raise exception 'Only approved loans can be handled';
    end if;

    if v_book.available_copies < v_loan.requested_copies then
      raise exception 'Insufficient copies available';
    end if;

    update public.books
    set available_copies = available_copies - v_loan.requested_copies
    where id = v_book.id;

    update public.loans
    set status = p_next_status,
        handled_at = now()
    where id = v_loan.id;
  elsif p_next_status = 'returned' then
    if v_loan.status <> 'handled' then
      raise exception 'Only handled loans can be returned';
    end if;

    update public.books
    set available_copies = available_copies + v_loan.requested_copies
    where id = v_book.id;

    update public.loans
    set status = p_next_status,
        returned_at = now()
    where id = v_loan.id;
  elsif p_next_status in ('approved', 'rejected') then
    if v_loan.status <> 'pending' then
      raise exception 'Only pending loans can be approved or rejected';
    end if;

    update public.loans
    set status = p_next_status
    where id = v_loan.id;
  else
    raise exception 'Unsupported loan transition';
  end if;

  return query select * from public.loans where id = v_loan.id;
end;
$$;

alter table public.libraries enable row level security;
alter table public.books enable row level security;
alter table public.loans enable row level security;
alter table public.librarian_libraries enable row level security;

create policy "Public can read libraries"
on public.libraries for select
using (true);

create policy "Public can read available books"
on public.books for select
using (available_copies > 0 and archived_at is null);

create policy "Librarians can view assigned loan mappings"
on public.librarian_libraries for select
using (auth.uid() = librarian_id);

create policy "Librarians can view assigned books"
on public.books for select
using (
  exists (
    select 1
    from public.librarian_libraries ll
    where ll.librarian_id = auth.uid()
      and ll.library_id = books.library_id
  )
);

create policy "Librarians can view assigned loans"
on public.loans for select
using (
  exists (
    select 1
    from public.librarian_libraries ll
    where ll.librarian_id = auth.uid()
      and ll.library_id = loans.library_id
  )
);
