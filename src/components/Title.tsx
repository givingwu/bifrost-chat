import type { PropsWithChildren } from 'react';

export const Title = ({ children }: PropsWithChildren) => {
    return (
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {children}
        </h2>
    );
};