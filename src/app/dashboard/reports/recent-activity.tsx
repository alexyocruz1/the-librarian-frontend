'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { BookOpenIcon, UsersIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/context/I18nContext';

export default function RecentActivity({ stats }: { stats: any }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader 
        title={t('reports.recent.title')} 
        subtitle={t('reports.recent.subtitle')}
      />
      <CardBody>
        <div className="space-y-4">
          {(stats.recentActivity ?? []).map((activity: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex-shrink-0 mt-1">
                {activity.type === 'borrow' && <BookOpenIcon className="w-4 h-4 text-primary-600" />}
                {activity.type === 'return' && <BookOpenIcon className="w-4 h-4 text-success-600" />}
                {activity.type === 'request' && <ClockIcon className="w-4 h-4 text-warning-600" />}
                {activity.type === 'overdue' && <ExclamationTriangleIcon className="w-4 h-4 text-error-600" />}
                {activity.type === 'approval' && <UsersIcon className="w-4 h-4 text-success-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('reports.activity.timestamp', { date: new Date(activity.timestamp).toLocaleString() })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}


