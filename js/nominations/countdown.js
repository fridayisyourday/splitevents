export function getCountdownParts(targetTime, nowTime = Date.now()) {
    const remaining = Math.max(0, Number(targetTime) - Number(nowTime));
    const totalMinutes = Math.floor(remaining / 60000);

    return {
        days: Math.floor(totalMinutes / 1440),
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60,
        finished: remaining === 0
    };
}