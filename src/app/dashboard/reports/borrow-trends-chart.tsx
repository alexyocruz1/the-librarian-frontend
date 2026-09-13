'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

const chartConfig = {
  count: {
    label: 'Borrows',
    color: 'var(--color-primary-600)',
  },
} satisfies ChartConfig;

function formatDayLabel(id: string) {
  const formatted = formatDate(id, 'MMM d');
  return formatted === 'Invalid date' ? id : formatted;
}

export default function BorrowTrendsChart({ stats }: { stats: any }) {
  const { t } = useI18n();
  const data = stats.borrowTrends ?? [];

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title={t('reports.borrowTrends.title')}
        subtitle={t('reports.borrowTrends.subtitle')}
      />
      <CardBody>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="borrowTrendsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary-600)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-primary-600)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="_id"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDayLabel}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(value) => formatDayLabel(String(value))} />
              }
            />
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#borrowTrendsFill)"
              stroke="var(--color-primary-600)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
