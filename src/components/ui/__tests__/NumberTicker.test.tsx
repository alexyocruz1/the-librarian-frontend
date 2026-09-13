import { render, screen } from '@testing-library/react'
import { NumberTicker } from '../number-ticker'

describe('NumberTicker', () => {
  it('renders the starting value without crashing', () => {
    render(<NumberTicker value={42} data-testid="ticker" />)
    expect(screen.getByTestId('ticker')).toBeInTheDocument()
    expect(screen.getByTestId('ticker')).toHaveTextContent('0')
  })

  it('supports a custom startValue', () => {
    render(<NumberTicker value={42} startValue={10} data-testid="ticker" />)
    expect(screen.getByTestId('ticker')).toHaveTextContent('10')
  })
})
