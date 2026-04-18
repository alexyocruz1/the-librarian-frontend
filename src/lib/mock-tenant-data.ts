import { LibrarianSession, LibraryTenant, TenantBook, TenantLoan } from '@/types/tenant';

export const mockLibraries: LibraryTenant[] = [
  {
    id: 'lib-honduras',
    name: 'Honduras City Library',
    subdomain: 'honduras',
    city: 'Tegucigalpa',
    accent: '#c76832',
    description: 'A community-focused catalog for civic reading rooms and school partnerships.',
  },
  {
    id: 'lib-newyork',
    name: 'New York Reading House',
    subdomain: 'newyork',
    city: 'New York',
    accent: '#17594a',
    description: 'A neighborhood-driven branch network with quick pickup and returns.',
  },
];

export const mockBooks: TenantBook[] = [
  {
    id: 'book-1',
    library_id: 'lib-honduras',
    title: 'The House on Mango Street',
    author: 'Sandra Cisneros',
    category: 'Fiction',
    total_copies: 8,
    available_copies: 5,
    archived_at: null,
  },
  {
    id: 'book-2',
    library_id: 'lib-honduras',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Improvement',
    total_copies: 6,
    available_copies: 2,
    archived_at: null,
  },
  {
    id: 'book-3',
    library_id: 'lib-honduras',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science',
    total_copies: 4,
    available_copies: 1,
    archived_at: null,
  },
  {
    id: 'book-4',
    library_id: 'lib-newyork',
    title: 'Beloved',
    author: 'Toni Morrison',
    category: 'Literature',
    total_copies: 7,
    available_copies: 4,
    archived_at: null,
  },
  {
    id: 'book-5',
    library_id: 'lib-newyork',
    title: 'Educated',
    author: 'Tara Westover',
    category: 'Memoir',
    total_copies: 5,
    available_copies: 3,
    archived_at: null,
  },
];

export const mockLibrarians: LibrarianSession[] = [
  {
    id: 'librarian-1',
    email: 'ana@librarian.test',
    full_name: 'Ana Rivera',
    library_ids: ['lib-honduras'],
  },
  {
    id: 'librarian-2',
    email: 'marcus@librarian.test',
    full_name: 'Marcus Green',
    library_ids: ['lib-honduras', 'lib-newyork'],
  },
];

export const mockLoans: TenantLoan[] = [
  {
    id: 'loan-1',
    library_id: 'lib-honduras',
    book_id: 'book-1',
    full_name: 'Luis Hernandez',
    identifier: 'luis@example.com',
    requested_copies: 1,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'loan-2',
    library_id: 'lib-honduras',
    book_id: 'book-2',
    full_name: 'Luis Hernandez',
    identifier: 'luis@example.com',
    requested_copies: 1,
    status: 'handled',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    handled_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'loan-3',
    library_id: 'lib-newyork',
    book_id: 'book-4',
    full_name: 'Maya Brooks',
    identifier: 'student-88',
    requested_copies: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];
