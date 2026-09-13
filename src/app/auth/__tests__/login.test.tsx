import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../login/page'
import { I18nProvider } from '@/context/I18nContext'
import { PreferencesProvider } from '@/context/PreferencesContext'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <PreferencesProvider>
      <I18nProvider>{ui}</I18nProvider>
    </PreferencesProvider>
  )

const mockPush = jest.fn()
const mockRefresh = jest.fn()

describe('Login Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders login form prefilled with demo credentials', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByRole('link', { name: /back to home|common.backToHome/i })).toBeInTheDocument()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
    expect((inputs[0] as HTMLInputElement).value).toBe('ana@librarian.test')
  })

  it('submits credentials and redirects on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    renderWithProviders(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /enter dashboard|signing in|auth\.login\.button/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'ana@librarian.test', password: 'library123' }),
        })
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows an error message when login fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    })

    renderWithProviders(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /enter dashboard|signing in|auth\.login\.button/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables the submit button while the request is in flight', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    ;(global.fetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    renderWithProviders(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /enter dashboard|signing in|auth\.login\.button/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    resolveFetch({ ok: true, json: async () => ({}) })
  })

  it('has a link back to the home page', () => {
    renderWithProviders(<LoginPage />)

    const backLink = screen.getByRole('link')
    expect(backLink).toHaveAttribute('href', '/')
  })
})
