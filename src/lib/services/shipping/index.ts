import { Carrier, ShippingProvider } from './types';
import { ShiprocketProvider } from './shiprocket';
import { DelhiveryProvider } from './delhivery';
import { BluedartProvider } from './bluedart';

export function getShippingProvider(carrier: Carrier): ShippingProvider {
  switch (carrier) {
    case 'shiprocket':
      return new ShiprocketProvider();
    case 'delhivery':
      return new DelhiveryProvider();
    case 'bluedart':
      return new BluedartProvider();
    default:
      return new ShiprocketProvider();
  }
}