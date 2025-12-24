import fetch from 'node-fetch';

const LUNO_API_URL = 'https://api.luno.com/api/1';

export interface LunoReceiveAddress {
  id: string;
  address: string;
  asset: string;
  total_received: string;
  total_unconfirmed: string;
}

export interface LunoTransaction {
  account_id: string;
  available: string;
  available_delta: string;
  balance: string;
  balance_delta: string;
  currency: string;
  description: string;
  row_index: string;
  timestamp: string;
}

export type CryptoAsset = 'XBT' | 'ETH' | 'USDT' | 'XMR' | 'DOGE';

export async function createLunoReceiveAddress(
  asset: CryptoAsset
): Promise<LunoReceiveAddress> {
  const apiKey = process.env.LUNO_API_KEY;
  const apiSecret = process.env.LUNO_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('LUNO credentials are not configured');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  const response = await fetch(`${LUNO_API_URL}/funding_address`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      asset,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create LUNO receive address: ${JSON.stringify(error)}`);
  }

  return await response.json() as LunoReceiveAddress;
}

export async function getLunoBalance(asset: CryptoAsset): Promise<any> {
  const apiKey = process.env.LUNO_API_KEY;
  const apiSecret = process.env.LUNO_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('LUNO credentials are not configured');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  const response = await fetch(`${LUNO_API_URL}/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get LUNO balance: ${JSON.stringify(error)}`);
  }

  const data: any = await response.json();
  const balance = data.balance?.find((b: any) => b.asset === asset);
  return balance;
}

export async function checkLunoTransaction(
  addressId: string,
  expectedAmount: string
): Promise<boolean> {
  const apiKey = process.env.LUNO_API_KEY;
  const apiSecret = process.env.LUNO_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('LUNO credentials are not configured');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  const response = await fetch(`${LUNO_API_URL}/funding_address/${addressId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to check LUNO transaction: ${JSON.stringify(error)}`);
  }

  const address = await response.json() as LunoReceiveAddress;
  const received = parseFloat(address.total_received);
  const expected = parseFloat(expectedAmount);
  
  return received >= expected;
}

export function convertZARToCrypto(zarAmount: number, asset: CryptoAsset): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${LUNO_API_URL}/ticker?pair=${asset}ZAR`);
      
      if (!response.ok) {
        reject(new Error('Failed to get crypto exchange rate'));
        return;
      }

      const data: any = await response.json();
      const rate = parseFloat(data.last_trade);
      const cryptoAmount = zarAmount / rate;
      
      resolve(parseFloat(cryptoAmount.toFixed(8)));
    } catch (error) {
      reject(error);
    }
  });
}
