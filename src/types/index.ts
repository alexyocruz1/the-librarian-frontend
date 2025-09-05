// User Types
export type UserRole = "superadmin" | "admin" | "student" | "guest";
export type UserStatus = "pending" | "active" | "rejected" | "suspended";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  libraries?: Library[];
  studentId?: string;
  profile?: {
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Library Types
export interface Library {
  _id: string;
  code: string;
  name: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Title Types
export interface Title {
  _id: string;
  isbn13?: string;
  isbn10?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  categories?: string[];
  language?: string;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export interface Inventory {
  _id: string;
  libraryId: string;
  titleId: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Copy Types
export type CopyStatus = "available" | "borrowed" | "reserved" | "lost" | "maintenance";
export type CopyCondition = "new" | "good" | "used" | "worn" | "damaged";

export interface Copy {
  _id: string;
  inventoryId: string;
  libraryId: string;
  titleId: string;
  barcode?: string;
  status: CopyStatus;
  condition: CopyCondition;
  acquiredAt?: string;
  shelfLocation?: string;
  createdAt: string;
  updatedAt: string;
}

// Borrow Request Types
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface BorrowRequest {
  _id: string;
  userId: string;
  libraryId: string;
  titleId: string;
  inventoryId?: string;
  copyId?: string;
  status: RequestStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  notes?: string;
}

// Borrow Record Types
export type LoanStatus = "borrowed" | "returned" | "overdue" | "lost";

export interface BorrowRecord {
  _id: string;
  userId: string;
  libraryId: string;
  titleId: string;
  inventoryId: string;
  copyId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  approvedBy: string;
  fees?: {
    lateFee?: number;
    damageFee?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'guest';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  libraries?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
  roles?: UserRole[];
  children?: NavItem[];
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Filter Types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface SearchFilters {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
  library?: string;
  category?: string;
  availability?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalLibraries: number;
  totalBooks: number;
  totalBorrows: number;
  pendingRequests: number;
  overdueBooks: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'user_registered' | 'book_borrowed' | 'book_returned' | 'request_approved' | 'request_rejected';
  message: string;
  timestamp: string;
  user?: string;
  book?: string;
  library?: string;
}

// CSV Import Types
export interface CSVBookData {
  isbn13?: string;
  isbn10?: string;
  title: string;
  subtitle?: string;
  authors: string;
  categories?: string;
  language?: string;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverUrl?: string;
  totalCopies: number;
  shelfLocation?: string;
  notes?: string;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
