import { render, screen, fireEvent } from '@testing-library/react'
import CopyModal from '../CopyModal'
import { I18nProvider } from '@/context/I18nContext'
import { PreferencesProvider } from '@/context/PreferencesContext'

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <PreferencesProvider>
      <I18nProvider>{ui}</I18nProvider>
    </PreferencesProvider>
  )

describe('CopyModal', () => {
  const baseProps = {
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    mode: 'create' as const,
    titleId: 'title-1',
    libraryId: 'lib-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    renderWithProviders(<CopyModal isOpen={false} {...baseProps} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the form when open, in an accessible dialog', () => {
    renderWithProviders(<CopyModal isOpen={true} {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderWithProviders(<CopyModal isOpen={true} {...baseProps} />)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the header close button is clicked', () => {
    renderWithProviders(<CopyModal isOpen={true} {...baseProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(baseProps.onClose).toHaveBeenCalled()
  })
})
