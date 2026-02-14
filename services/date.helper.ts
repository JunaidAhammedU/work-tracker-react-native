export const formatHumanDateTime = (
    isoString: string,
    locale: string = 'en-IN'
): string => {
    const date = new Date(isoString)

    return date.toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}
