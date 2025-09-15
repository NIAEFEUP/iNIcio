export function getDateString(date: Date) {
  if (!date) return "";

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getDateStringPT(date: Date) {
  if (!date) return "";

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function getTimeString(date: Date) {
  if (!date) return "";

  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
