import { DEPENDENCIAS } from '@/lib/mocks/data';
import DependenciaClient from './DependenciaClient';

export async function generateStaticParams() {
    return DEPENDENCIAS.map((dep) => ({
        codigo: dep.codigo,
    }));
}

export default function DependenciaPage() {
    return <DependenciaClient />;
}
