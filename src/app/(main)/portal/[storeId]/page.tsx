'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalPage({ params }: { params: Promise<{ storeId: string }> }) {
    const { storeId } = use(params);
    const router = useRouter();
    useEffect(() => { router.replace('/menu'); }, [router]);
    return null;
}
