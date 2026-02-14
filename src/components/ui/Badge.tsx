import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Badge({
    children,
    variant = 'default',
    className
}: {
    children: React.ReactNode,
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline',
    className?: string
}) {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
        destructive: "bg-rose-500 text-white hover:bg-rose-600",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    };

    return (
        <div className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )}>
            {children}
        </div>
    );
}
