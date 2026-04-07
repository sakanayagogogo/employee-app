export function getRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    // 未来の日付の場合は「たった今」とする
    if (diffInSeconds < 0) return 'たった今';

    if (diffInSeconds < 60) {
        return 'たった今';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}分前`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}時間前`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 31) {
        return `${diffInDays}日前`;
    }

    // 正確な月差・年差を計算
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (months < 12) {
        return `${Math.max(1, months)}ヶ月前`;
    }

    const years = now.getFullYear() - d.getFullYear();
    return `${years}年前`;
}
