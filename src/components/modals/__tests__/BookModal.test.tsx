import { render, screen, fireEvent } from '@testing-library/react'
import BookModal from '../BookModal'
import { I18nProvider } from '@/context/I18nContext'
import { PreferencesProvider } from '@/context/PreferencesContext'

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <PreferencesProvider>
      <I18nProvider>{ui}</I18nProvider>
    </PreferencesProvider>
  )

describe('BookModal', () => {
  const baseProps = {
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    mode: 'create' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    renderWithProviders(<BookModal isOpen={false} {...baseProps} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the form when open, in an accessible dialog', () => {
    renderWithProviders(<BookModal isOpen={true} {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderWithProviders(<BookModal isOpen={true} {...baseProps} />)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the header close button is clicked', () => {
    renderWithProviders(<BookModal isOpen={true} {...baseProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(baseProps.onClose).toHaveBeenCalled()
  })
})
