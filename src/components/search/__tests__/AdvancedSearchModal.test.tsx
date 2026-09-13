import { render, screen, fireEvent } from '@testing-library/react'
import AdvancedSearchModal from '../AdvancedSearchModal'

describe('AdvancedSearchModal', () => {
  const baseProps = {
    onClose: jest.fn(),
    onSearch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<AdvancedSearchModal isOpen={false} {...baseProps} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the form when open, in an accessible dialog', () => {
    render(<AdvancedSearchModal isOpen={true} {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<AdvancedSearchModal isOpen={true} {...baseProps} />)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the header close button is clicked', () => {
    render(<AdvancedSearchModal isOpen={true} {...baseProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(baseProps.onClose).toHaveBeenCalled()
  })
})
