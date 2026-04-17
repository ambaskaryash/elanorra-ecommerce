const DEFAULT_MEDUSA_BACKEND_URL = 'http://localhost:9000';
const DEFAULT_MEDUSA_REGION_ID = 'reg_01KPBVSBR9GX30ADAMJDVKWDVF';
const DEFAULT_MEDUSA_PUBLISHABLE_KEY = 'pk_e460614ceff07dd0be6d876364d4215d6c8b0866d8eff4f5606e4936f79060c4';

export const medusaConfig = {
  backendUrl:
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    DEFAULT_MEDUSA_BACKEND_URL,
  publishableKey:
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    DEFAULT_MEDUSA_PUBLISHABLE_KEY,
  regionId:
    process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ||
    DEFAULT_MEDUSA_REGION_ID,
};

export function isMedusaCatalogEnabled() {
  return process.env.NEXT_PUBLIC_COMMERCE_BACKEND === 'medusa';
}
