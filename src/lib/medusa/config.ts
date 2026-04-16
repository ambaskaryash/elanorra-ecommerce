const DEFAULT_MEDUSA_BACKEND_URL = 'http://localhost:9000';
const DEFAULT_MEDUSA_REGION_ID = 'reg_01KP88WGBK7TX0WWBKSDNAT2ZY';
const DEFAULT_MEDUSA_PUBLISHABLE_KEY = 'pk_8be171d051081664a9fd2e240edc58e050e12631a7e5a7e08b0b37c377c39f29';

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
