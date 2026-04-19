import { medusaFetch } from './src/lib/medusa/client';
import { medusaConfig } from './src/lib/medusa/config';

async function test() {
  console.log('1. Creating Cart...');
  const cartRes = await medusaFetch('/store/carts', {
    method: 'POST',
    body: JSON.stringify({
      region_id: medusaConfig.regionId,
      sales_channel_id: 'sc_01KPAR7V31W1NWNQ96ZJ8NGWQC',
    })
  });
  const cartId = cartRes.cart.id;
  console.log('Cart ID:', cartId);

  console.log('2. Creating Payment Collection...');
  const colRes = await medusaFetch('/store/payment-collections', {
    method: 'POST',
    body: JSON.stringify({ cart_id: cartId })
  });
  const collectionId = colRes.payment_collection.id;
  console.log('Collection ID:', collectionId);

  console.log('3. Creating Payment Session...');
  const sessRes = await medusaFetch(`/store/payment-collections/${collectionId}/payment-sessions`, {
    method: 'POST',
    body: JSON.stringify({ provider_id: 'pp_system_default' })
  });
  const sessionId = sessRes.payment_collection.payment_sessions[0].id;
  console.log('Session ID:', sessionId);

  console.log('4. Authorizing Session...');
  try {
    const authRes = await medusaFetch(`/store/payment-collections/${collectionId}/payment-sessions/${sessionId}/authorize`, {
      method: 'POST'
    });
    console.log('Auth OK');
  } catch (e) {
    console.error('Auth Error:', e.message);
  }

  console.log('5. Completing Cart...');
  try {
    const compRes = await medusaFetch(`/store/carts/${cartId}/complete`, {
      method: 'POST'
    });
    console.log('Complete OK', compRes.order.id);
  } catch(e) {
    console.error('Complete Error:', e.message);
  }
}
test().catch(console.error);
