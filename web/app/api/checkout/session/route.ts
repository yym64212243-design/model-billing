import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, {}) : null;
}

export async function GET(request: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    if (checkoutSession.client_reference_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const planId = (checkoutSession.metadata?.planId ?? 'plan_10') as PlanId;
    const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
    const credits = parseInt(checkoutSession.metadata?.credits ?? '0', 10);
    return NextResponse.json({
      planId: plan.id,
      planName: plan.name,
      credits,
      paymentStatus: checkoutSession.payment_status,
    });
  } catch (e) {
    console.error('Retrieve session error:', e);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
