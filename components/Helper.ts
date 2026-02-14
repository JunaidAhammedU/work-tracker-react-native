export const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
        case 'P1':
            return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' };
        case 'P2':
            return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' };
        case 'P3':
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' };
        default:
            return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' };
    }
};

export const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return { bg: 'bg-lime-400/10', text: 'text-lime-400', border: 'border-lime-400/30' };
        case 'in progress':
            return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' };
        case 'pending':
            return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' };
        default:
            return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' };
    }
};
