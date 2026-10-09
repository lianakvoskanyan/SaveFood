import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "./env";

export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});
