import { render, screen } from '@testing-library/react'
import BorrowTrendsChart from '../borrow-trends-chart'
import { I18nProvider } from '@/context/I18nContext'
import { PreferencesProvider } from '@/context/PreferencesContext'

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <PreferencesProvider>
      <I18nProvider>{ui}</I18nProvider>
    </PreferencesProvider>
  )

describe('BorrowTrendsChart', () => {
  it('renders nothing when there is no trend data', () => {
    const { container } = renderWithProviders(<BorrowTrendsChart stats={{ borrowTrends: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the chart card when trend data is present', async () => {
    renderWithProviders(
      <BorrowTrendsChart
        stats={{
          borrowTrends: [
            { _id: '2026-01-01', count: 3 },
            { _id: '2026-01-02', count: 5 },
          ],
        }}
      />
    )
    expect(await screen.findByText('Borrow Trends')).toBeInTheDocument()
  })
})
