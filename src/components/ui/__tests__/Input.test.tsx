import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('block', 'w-full')
  })

  it('renders with label', () => {
    render(<Input label="Test Label" />)
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders with help text', () => {
    render(<Input help="This is help text" />)
    
    expect(screen.getByText('This is help text')).toBeInTheDocument()
  })

  it('renders with error message', () => {
    render(<Input error="This is an error" />)
    
    const errorMessage = screen.getByText('This is an error')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass('text-error-600')
  })

  it('shows error styling when error is present', () => {
    render(<Input error="Error message" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-error-300', 'focus:ring-error-500', 'focus:border-error-500')
  })

  it('renders with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">🔍</span>
    render(<Input leftIcon={<LeftIcon />} />)
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('pl-10')
  })

  it('renders with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">✓</span>
    render(<Input rightIcon={<RightIcon />} />)
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('pr-10')
  })

  it('handles input changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test input')
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('test input')
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('can be required', () => {
    render(<Input required />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'number')
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('can be fullWidth or not', () => {
    const { rerender } = render(<Input fullWidth={true} />)
    expect(screen.getByRole('textbox').parentElement?.parentElement).toHaveClass('w-full')

    rerender(<Input fullWidth={false} />)
    expect(screen.getByRole('textbox').parentElement?.parentElement).not.toHaveClass('w-full')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<Input label="Test Label" help="Help text" />)
    
    const input = screen.getByLabelText('Test Label')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('has proper accessibility attributes when error is present', () => {
    render(<Input label="Test Label" error="Error message" />)
    
    const input = screen.getByLabelText('Test Label')
    expect(input).toHaveAttribute('aria-describedby')
  })
})
