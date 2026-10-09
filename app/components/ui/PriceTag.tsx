import { formatAmd } from "../../lib/format";

type PriceTagProps = {
  originalPriceAmd: number;
  discountedPriceAmd: number;
};

export function PriceTag({
  originalPriceAmd,
  discountedPriceAmd,
}: PriceTagProps) {
  const hasDiscount = discountedPriceAmd < originalPriceAmd;

  return (
    <p className="price-tag">
      <span className="price-tag-now">{formatAmd(discountedPriceAmd)}</span>
      {hasDiscount ? (
        <span className="price-tag-was">{formatAmd(originalPriceAmd)}</span>
      ) : null}
    </p>
  );
}
