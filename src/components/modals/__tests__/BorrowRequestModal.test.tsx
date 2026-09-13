import { render, screen, fireEvent } from '@testing-library/react'
import BorrowRequestModal from '../BorrowRequestModal'
import { I18nProvider } from '@/context/I18nContext'
import { PreferencesProvider } from '@/context/PreferencesContext'
import { LibraryProvider } from '@/context/LibraryContext'
import { Title } from '@/types'

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <PreferencesProvider>
      <I18nProvider>
        <LibraryProvider>{ui}</LibraryProvider>
      </I18nProvider>
    </PreferencesProvider>
  )

const title: Title = {
  _id: 'title-1',
  title: 'A Book',
  authors: ['An Author'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('BorrowRequestModal', () => {
  const baseProps = {
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    title,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    renderWithProviders(<BorrowRequestModal isOpen={false} {...baseProps} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the form when open, in an accessible dialog', () => {
    renderWithProviders(<BorrowRequestModal isOpen={true} {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderWithProviders(<BorrowRequestModal isOpen={true} {...baseProps} />)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the header close button is clicked', () => {
    renderWithProviders(<BorrowRequestModal isOpen={true} {...baseProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(baseProps.onClose).toHaveBeenCalled()
  })
})
