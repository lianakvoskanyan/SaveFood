import { z } from "zod";

export const amdPriceSchema = z
  .number()
  .int("Price must be a whole number of AMD")
  .positive("Price must be greater than zero");

export const offerPricesSchema = z
  .object({
    originalPriceAmd: amdPriceSchema,
    discountedPriceAmd: amdPriceSchema,
  })
  .refine((value) => value.discountedPriceAmd <= value.originalPriceAmd, {
    message: "Discounted price cannot exceed the original price",
    path: ["discountedPriceAmd"],
  });
