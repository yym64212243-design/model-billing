import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { PLANS } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {});
}

function getStripePriceId(planId: PlanId): string | null {
  const key = `STRIPE_PRICE_${planId.toUpperCase().replace('plan_', '')}` as
    | 'STRIPE_PRICE_5'
    | 'STRIPE_PRICE_10'
    | 'STRIPE_PRICE_20';
  return process.env[key] ?? null;
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in .env' },
        { status: 503 }
      );
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { planId, returnUrl } = body as { planId?: string; returnUrl?: string };
    const pid = (planId as PlanId) ?? 'plan_10';
    const plan = PLANS.find((p) => p.id === pid) ?? PLANS[1];
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const successUrl = new URL('/success', baseUrl);
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    if (returnUrl) successUrl.searchParams.set('return_url', returnUrl);
    const cancelUrl = `${baseUrl}/billing`;

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = getStripePriceId(plan.id)
      ? {
          price: getStripePriceId(plan.id)!,
          quantity: 1,
        }
      : {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: Math.round(plan.price * 100),
            product_data: {
              name: plan.name,
              description: plan.description,
              images: [],
            },
          },
          quantity: 1,
        };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [lineItem],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        credits: String(plan.credits),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error('Create checkout session error:', e);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
