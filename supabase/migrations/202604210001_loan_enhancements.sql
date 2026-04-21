-- Migration: Add Loan and Book condition fields
-- Adds due_date, condition tracking, and return notes

-- 1. Update books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS good_copies integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fair_copies integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bad_copies integer NOT NULL DEFAULT 0;

-- Initialize existing books: all copies to 'good'
UPDATE public.books SET good_copies = total_copies WHERE good_copies = 0 AND total_copies > 0;

-- 2. Update loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS delivery_condition jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS return_note text;

-- 3. Update create_public_loan_request to accept due_date
CREATE OR REPLACE FUNCTION public.create_public_loan_request(
  p_library_id uuid,
  p_book_id uuid,
  p_full_name text,
  p_identifier text,
  p_requested_copies integer,
  p_request_ip inet,
  p_due_date date DEFAULT NULL
)
RETURNS SETOF public.loans
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book public.books;
  v_count integer;
  v_duplicate integer;
  v_loan public.loans;
BEGIN
  IF trim(coalesce(p_full_name, '')) = '' OR trim(coalesce(p_identifier, '')) = '' THEN
    RAISE EXCEPTION 'Required fields cannot be empty';
  END IF;

  IF p_requested_copies < 1 THEN
    RAISE EXCEPTION 'requested_copies must be at least 1';
  END IF;

  -- Rate limit check
  SELECT count(*) INTO v_count FROM public.loan_request_events
  WHERE request_ip = p_request_ip AND created_at >= now() - interval '1 minute';
  IF v_count >= 5 THEN RAISE EXCEPTION 'Rate limit exceeded for this IP'; END IF;

  -- Duplicate check
  SELECT count(*) INTO v_duplicate FROM public.loans
  WHERE library_id = p_library_id AND book_id = p_book_id AND lower(identifier) = lower(p_identifier)
    AND created_at >= now() - interval '10 minutes';
  IF v_duplicate > 0 THEN RAISE EXCEPTION 'Duplicate loan request detected'; END IF;

  SELECT * INTO v_book FROM public.books WHERE id = p_book_id AND library_id = p_library_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Book not found for this library'; END IF;

  IF v_book.available_copies < p_requested_copies THEN
    RAISE EXCEPTION 'Requested copies exceed available inventory';
  END IF;

  INSERT INTO public.loan_request_events (library_id, identifier, book_id, request_ip)
  VALUES (p_library_id, p_identifier, p_book_id, p_request_ip);

  INSERT INTO public.loans (library_id, book_id, full_name, identifier, requested_copies, due_date)
  VALUES (p_library_id, p_book_id, p_full_name, p_identifier, p_requested_copies, p_due_date)
  RETURNING * INTO v_loan;

  RETURN QUERY SELECT * FROM public.loans WHERE id = v_loan.id;
END;
$$;

-- 4. Update transition_loan_status to handle conditions and notes
CREATE OR REPLACE FUNCTION public.transition_loan_status(
  p_loan_id uuid,
  p_next_status public.loan_status,
  p_librarian_id uuid,
  p_delivery_condition jsonb DEFAULT '{}'::jsonb,
  p_return_note text DEFAULT NULL
)
RETURNS SETOF public.loans
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loan public.loans;
  v_book public.books;
BEGIN
  -- Permission check
  IF NOT EXISTS (
    SELECT 1 FROM public.librarian_libraries ll JOIN public.loans l ON l.library_id = ll.library_id
    WHERE ll.librarian_id = p_librarian_id AND l.id = p_loan_id
  ) THEN
    RAISE EXCEPTION 'Librarian is not assigned to this library';
  END IF;

  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;

  SELECT * INTO v_book FROM public.books WHERE id = v_loan.book_id FOR UPDATE;

  IF p_next_status = 'handled' THEN
    IF v_loan.status <> 'approved' THEN RAISE EXCEPTION 'Only approved loans can be handled'; END IF;
    IF v_book.available_copies < v_loan.requested_copies THEN RAISE EXCEPTION 'Insufficient copies available'; END IF;

    UPDATE public.books SET available_copies = available_copies - v_loan.requested_copies WHERE id = v_book.id;
    UPDATE public.loans SET status = p_next_status, handled_at = now(), delivery_condition = p_delivery_condition WHERE id = v_loan.id;

  ELSIF p_next_status = 'returned' THEN
    IF v_loan.status <> 'handled' THEN RAISE EXCEPTION 'Only handled loans can be returned'; END IF;

    UPDATE public.books SET available_copies = available_copies + v_loan.requested_copies WHERE id = v_book.id;
    UPDATE public.loans SET status = p_next_status, returned_at = now(), return_note = p_return_note WHERE id = v_loan.id;

  ELSIF p_next_status IN ('approved', 'rejected') THEN
    IF v_loan.status <> 'pending' THEN RAISE EXCEPTION 'Only pending loans can be approved or rejected'; END IF;
    UPDATE public.loans SET status = p_next_status WHERE id = v_loan.id;
  ELSE
    RAISE EXCEPTION 'Unsupported loan transition';
  END IF;

  RETURN QUERY SELECT * FROM public.loans WHERE id = v_loan.id;
END;
$$;
