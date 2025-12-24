import fetch from 'node-fetch';

const YOCO_API_URL = 'https://online.yoco.com/v1';

export interface YocoPaymentRequest {
  token: string;
  amountInCents: number;
  currency: string;
}

export interface YocoPaymentResponse {
  id: string;
  status: string;
  currency: string;
  amount: number;
  createdDate: string;
}

export async function processYocoPayment(
  token: string,
  amountInCents: number,
  currency: string = 'ZAR'
): Promise<YocoPaymentResponse> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('YOCO_SECRET_KEY is not configured');
  }

  const response = await fetch(`${YOCO_API_URL}/charges/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      amountInCents,
      currency,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Yoco payment failed: ${JSON.stringify(error)}`);
  }

  return await response.json() as YocoPaymentResponse;
}

export async function verifyYocoPayment(paymentId: string): Promise<YocoPaymentResponse> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('YOCO_SECRET_KEY is not configured');
  }

  const response = await fetch(`${YOCO_API_URL}/charges/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify Yoco payment: ${JSON.stringify(error)}`);
  }

  return await response.json() as YocoPaymentResponse;
}
