import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, {}) : null;
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const creditsStr = session.metadata?.credits;
    if (!userId || !creditsStr) {
      console.error('Webhook: missing userId or credits in metadata', session.id);
      return NextResponse.json({ received: true });
    }
    const credits = parseInt(creditsStr, 10);
    if (Number.isNaN(credits) || credits <= 0) {
      console.error('Webhook: invalid credits', creditsStr);
      return NextResponse.json({ received: true });
    }
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
      });
    } catch (e) {
      console.error('Webhook: failed to add credits', e);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
