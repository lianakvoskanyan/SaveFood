import { formatPickupWindow } from "../../lib/format";

type PickupWindowProps = {
  startIso: string;
  endIso: string;
};

export function PickupWindow({ startIso, endIso }: PickupWindowProps) {
  return (
    <p className="pickup-window">
      <span className="pickup-window-label">Pickup</span>
      {formatPickupWindow(startIso, endIso)}
    </p>
  );
}
