export type LoanStatus = 'pending' | 'approved' | 'handled' | 'returned' | 'rejected';

export interface LibraryTenant {
  id: string;
  name: string;
  subdomain: string;
  city?: string;
  accent?: string;
  description?: string;
}

export interface TenantBook {
  id: string;
  library_id: string;
  title: string;
  author: string;
  categories: string[];
  total_copies: number;
  available_copies: number;
  library_codes: string[]; // Sequential codes like subdomain0001
  book_code?: string;      // Manual code
  editorial?: string;
  edition?: string;
  cover_type?: 'hardcover' | 'softcover';
  shelf_location?: string;
  cost?: number;
  acquired_at?: string;
  image_url?: string;
  good_copies: number;
  fair_copies: number;
  bad_copies: number;
  archived_at?: string | null;
}

export interface TenantLoan {
  id: string;
  library_id: string;
  book_id: string;
  full_name: string;
  identifier: string;
  requested_copies: number;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  handled_at?: string | null;
  returned_at?: string | null;
  due_date?: string | null;
  delivery_condition?: { good: number; fair: number; bad: number } | null;
  return_condition?: { good: number; fair: number; bad: number } | null;
  return_note?: string | null;
  book?: Pick<TenantBook, 'id' | 'title' | 'author' | 'categories'>;
}

export interface LibrarianSession {
  id: string;
  email: string;
  full_name: string;
  library_ids: string[];
}

export interface LoanRequestPayload {
  full_name: string;
  identifier: string;
  book_id: string;
  requested_copies: number;
  due_date: string;
}

export interface BookMutationPayload {
  library_id: string;
  title: string;
  author: string;
  categories: string[];
  total_copies: number;
  available_copies: number;
  book_code?: string;
  editorial?: string;
  edition?: string;
  cover_type?: 'hardcover' | 'softcover';
  shelf_location?: string;
  cost?: number;
  acquired_at?: string;
  image_url?: string;
  good_copies: number;
  fair_copies: number;
  bad_copies: number;
}

