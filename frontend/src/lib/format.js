export const dateLabel = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => value ? new Intl.DateTimeFormat('en', options).format(new Date(value)) : 'Not recorded';
export const timeLabel = (value) => value ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';
