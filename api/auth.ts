import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const serverPassword = process.env.APP_PASSWORD;
  if (!serverPassword) {
    console.error('APP_PASSWORD environment variable is not configured');
    return res.status(500).json({
      success: false,
      message: 'Server authentication is not configured.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const inputPassword = typeof body.password === 'string' ? body.password : '';

    if (!inputPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const isValid = safeCompare(inputPassword, serverPassword);
    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Authenticated successfully.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid password. Please try again.',
    });
  } catch (error: any) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify password.',
    });
  }
}
