import { PQRS_MOCK } from '@/lib/mocks/data';
import PQRDetailsClient from './PQRDetailsClient';

export async function generateStaticParams() {
    return PQRS_MOCK.map((pqr) => ({
        id: pqr.id,
    }));
}

export default function PQRDetailsPage() {
    return <PQRDetailsClient />;
}
