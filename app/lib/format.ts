const amdFormatter = new Intl.NumberFormat("hy-AM", {
  maximumFractionDigits: 0,
});

const pickupFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatAmd(amount: number) {
  return `${amdFormatter.format(amount)} ֏`;
}

export function formatPickupWindow(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Pickup time unavailable";
  }

  return `${pickupFormatter.format(start)}–${pickupFormatter.format(end)}`;
}
