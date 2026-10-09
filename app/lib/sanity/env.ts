function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const sanityProjectId = requireEnv(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const sanityDataset = requireEnv(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "NEXT_PUBLIC_SANITY_DATASET",
);

export const sanityApiVersion = requireEnv(
  process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  "NEXT_PUBLIC_SANITY_API_VERSION",
);
