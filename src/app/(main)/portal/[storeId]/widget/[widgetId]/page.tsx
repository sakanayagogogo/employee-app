'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SingleWidgetPage({ params }: { params: Promise<{ storeId: string; widgetId: string }> }) {
    const { widgetId } = use(params);
    const router = useRouter();
    useEffect(() => { router.replace(`/menu/widget/${widgetId}`); }, [router, widgetId]);
    return null;
}
