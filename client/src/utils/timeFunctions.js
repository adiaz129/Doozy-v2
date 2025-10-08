export const getTimePassedString = (timestamp) => {
  const timestampMs = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1e6);
  const now = new Date();
  const nowMs = now.getTime();
  const timePassedMs = nowMs - timestampMs;
  const timePassedS = Math.floor(timePassedMs / (1000));
  if (timePassedS < 60) {
    if (timePassedS === 1) {
      return `1 second ago`;
    }
    return `${timePassedS} seconds ago`;
  }
  const timePassedM = Math.round(timePassedMs / (1000 * 60));
  if (timePassedM < 60) {
    if (timePassedM === 1) {
      return `1 minute ago`;
    }
    return `${timePassedM} minutes ago`;
  }
  const timePassedH = Math.round(timePassedMs / (1000 * 60 * 60));
  if (timePassedH < 24) {
    if (timePassedH === 1) {
      return `1 hour ago`;
    }
    return `${timePassedH} hours ago`;
  }
  const timePassedD = Math.round(timePassedMs / (1000 * 60 * 60 * 24));
  if (timePassedD < 7) {
    if (timePassedD === 1) {
      return `1 day ago`;
    }
    return `${timePassedD} days ago`;
  }
  const date = new Date(timestampMs);
  return date.toLocaleDateString();
}

function daysUntil(targetTimestampMs) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const targetDateObj = new Date(targetTimestampMs);
  const targetDate = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate());

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Calculate day difference
  return Math.floor((targetDate - today) / MS_PER_DAY);
}

function getTimeFromMs(ms) {
  const date = new Date(ms);

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // convert 0 to 12 for 12am/pm

  return `${hours}:${minutes} ${ampm}`;
}

function formatDateShort(date) {
  const month = date.getMonth() + 1; // months are zero-based
  const day = date.getDate();
  const year = date.getFullYear() % 100; // get last two digits of year
  return `${month}/${day}/${year}`;
}

export const getDueDateString = (timestamp, isTime) => {
  let timestampMs;
  if (timestamp.seconds) {
    timestampMs = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1e6);
  }
  else {
    timestampMs = new Date(timestamp).getTime();
  }
  const daysUntilTimestamp = daysUntil(timestampMs);
  if (daysUntilTimestamp === 0) {
    if (isTime) {
      const now = new Date();
      const nowMs = now.getTime();
      if (timestampMs < nowMs) {
        return `-${getTimeFromMs(timestampMs)}`
      }
      else {
        return getTimeFromMs(timestampMs);

      }
    }
    else {
      return 'Today';
    }
  }
  else if (daysUntilTimestamp === 1) {
    return 'Tomorrow'
  }
  else if (daysUntilTimestamp === -1) {
    return '-Yesterday'
  }
  else {
    const date = new Date(timestampMs);
    if (daysUntilTimestamp < 0) {
      return `-${formatDateShort(date)}`;
    }
    else {
      return formatDateShort(date);
    }
  }
}