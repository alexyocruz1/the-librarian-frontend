'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/context/I18nContext';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export default function PopularBooks({ stats }: { stats: any }) {
  const { t } = useI18n();
  const { formatNumber } = useLocaleFormat();
  return (
    <Card>
      <CardHeader 
        title={t('reports.popular.title')} 
        subtitle={t('reports.popular.subtitle')}
      />
      <CardBody>
        <div className="space-y-4">
          {(stats.popularBooks ?? []).map((book: any, index: number) => (
            <motion.div
              key={book.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">#{index + 1}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{book.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(book.borrowCount)} borrows</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                {book.borrowCount}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}


