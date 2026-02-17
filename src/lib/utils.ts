import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addDays, isWeekend, format, isSameDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Colombian Holidays 2026 (Approximate - Fixed + Calculated)
const HOLIDAYS_2026 = [
    new Date(2026, 0, 1),   // Año Nuevo
    new Date(2026, 0, 12),  // Reyes Magos
    new Date(2026, 2, 23),  // San José
    new Date(2026, 3, 2),   // Jueves Santo
    new Date(2026, 3, 3),   // Viernes Santo
    new Date(2026, 4, 1),   // Día del Trabajo
    new Date(2026, 4, 18),  // Ascensión del Señor
    new Date(2026, 5, 8),   // Corpus Christi
    new Date(2026, 5, 15),  // Sagrado Corazón
    new Date(2026, 5, 29),  // San Pedro y San Pablo
    new Date(2026, 6, 20),  // Día de la Independencia
    new Date(2026, 7, 7),   // Batalla de Boyacá
    new Date(2026, 7, 17),  // Asunción de la Virgen
    new Date(2026, 9, 12),  // Día de la Raza
    new Date(2026, 10, 2),  // Todos los Santos
    new Date(2026, 10, 16), // Independencia de Cartagena
    new Date(2026, 11, 8),  // Inmaculada Concepción
    new Date(2026, 11, 25), // Navidad
];

export function addBusinessDays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let addedDays = 0;

    while (addedDays < days) {
        currentDate = addDays(currentDate, 1);

        const isSaturdayOrSunday = isWeekend(currentDate);
        const isHoliday = HOLIDAYS_2026.some(holiday =>
            isSameDay(currentDate, holiday)
        );

        if (!isSaturdayOrSunday && !isHoliday) {
            addedDays++;
        }
    }

    return currentDate;
}
