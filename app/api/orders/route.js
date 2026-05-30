/**
 * app/api/orders/route.js
 * Handles incoming COD order submissions from the checkout form.
 *
 * Extend this handler to:
 *  - Save orders to a database (e.g. Supabase, MongoDB, Prisma)
 *  - Send SMS confirmations via Twilio / local DZ providers
 *  - Push to a Google Sheet via the Sheets API
 *  - Notify via Telegram bot for quick ops visibility
 */

import { NextResponse } from 'next/server';

/**
 * Simple server-side validation helper.
 */
function validateOrder({ name, phone, wilaya, commune }) {
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('Full name must be at least 2 characters.');

  // Algerian mobile numbers: 05XX, 06XX, 07XX — 10 digits
  const phoneClean = phone?.replace(/\s/g, '');
  if (!phoneClean || !/^(05|06|07)\d{8}$/.test(phoneClean))
    errors.push('Please enter a valid Algerian phone number (05XX XXXXXXXX).');

  if (!wilaya || wilaya.trim().length < 2)
    errors.push('Wilaya is required.');

  if (!commune || commune.trim().length < 2)
    errors.push('Commune is required.');

  return errors;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, wilaya, commune } = body;

    // ── Validate ──────────────────────────────────────────
    const errors = validateOrder({ name, phone, wilaya, commune });
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: errors[0] },
        { status: 422 }
      );
    }

    // ── Build Order Record ────────────────────────────────
    const order = {
      id:        `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status:    'pending',
      customer: {
        name:    name.trim(),
        phone:   phone.trim(),
        wilaya:  wilaya.trim(),
        commune: commune.trim(),
      },
      payment: 'cash_on_delivery',
    };

    // ── Persist / Notify (TODO: wire your service here) ──
    // Example: await db.orders.create({ data: order });
    // Example: await notifyTelegram(order);
    console.log('[ORDER]', JSON.stringify(order, null, 2));

    // ── Respond ───────────────────────────────────────────
    return NextResponse.json(
      { success: true, orderId: order.id },
      { status: 201 }
    );

  } catch (err) {
    console.error('[ORDER_ERROR]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Return 405 for all other HTTP methods
export async function GET() {
  return NextResponse.json({ message: 'Method not allowed.' }, { status: 405 });
}
