'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/context/I18nContext';

export default function QuickActions({ onExport }: { onExport: (type: string) => void }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader title={t('reports.quickActions.title')} />
      <CardBody>
        <div className="space-y-3">
          <Button
            fullWidth
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            onClick={() => onExport('Books')}
          >
            {t('reports.quickActions.exportBooks')}
          </Button>
          <Button
            fullWidth
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            onClick={() => onExport('Users')}
          >
            {t('reports.quickActions.exportUsers')}
          </Button>
          <Button
            fullWidth
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            onClick={() => onExport('Loans')}
          >
            {t('reports.quickActions.exportLoans')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}


