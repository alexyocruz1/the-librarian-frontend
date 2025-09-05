import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    main: 'main',
    aside: 'aside',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    a: 'a',
    img: 'img',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    form: 'form',
    label: 'label',
    table: 'table',
    thead: 'thead',
    tbody: 'tbody',
    tr: 'tr',
    td: 'td',
    th: 'th',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock API client
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    approveStudent: jest.fn(),
    rejectStudent: jest.fn(),
    getPendingStudents: jest.fn(),
    getLibraries: jest.fn(),
    getLibraryById: jest.fn(),
    createLibrary: jest.fn(),
    updateLibrary: jest.fn(),
    deleteLibrary: jest.fn(),
    getLibraryAdmins: jest.fn(),
    assignAdminToLibrary: jest.fn(),
    removeAdminFromLibrary: jest.fn(),
  },
}))

// Mock Auth Context
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      status: 'active',
      libraries: ['1'],
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    hasRole: jest.fn(() => true),
    hasLibraryAccess: jest.fn(() => true),
  }),
  AuthProvider: ({ children }) => children,
}))

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      status: 'active',
      libraries: ['1'],
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    hasRole: jest.fn(() => true),
    hasLibraryAccess: jest.fn(() => true),
  }),
}))

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    status: 'active',
    libraries: ['1'],
    ...overrides,
  }),
  
  createMockLibrary: (overrides = {}) => ({
    _id: '1',
    code: 'TEST-01',
    name: 'Test Library',
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
    },
    contact: {
      email: 'test@library.com',
      phone: '123-456-7890',
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }),
  
  createMockTitle: (overrides = {}) => ({
    _id: '1',
    title: 'Test Book',
    authors: ['Test Author'],
    isbn13: '9781234567890',
    categories: ['Fiction'],
    publisher: 'Test Publisher',
    publishedYear: 2023,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }),
  
  createMockInventory: (overrides = {}) => ({
    _id: '1',
    libraryId: '1',
    titleId: '1',
    totalCopies: 5,
    availableCopies: 5,
    shelfLocation: 'A1-B2',
    notes: 'Test inventory',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }),
  
  createMockCopy: (overrides = {}) => ({
    _id: '1',
    inventoryId: '1',
    libraryId: '1',
    titleId: '1',
    barcode: 'TEST-01-2025-0001',
    status: 'available',
    condition: 'good',
    shelfLocation: 'A1-B2',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }),
}
