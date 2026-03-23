import { NextResponse } from 'next/server';
import { stripe } from '@/libs/stripe';
import { createAdminClient } from '@/libs/supabaseServer';
import { headers } from 'next/headers';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('Stripe-Signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (!sig || !webhookSecret) return new NextResponse('Webhook Error', { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = await createAdminClient();
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const user_id = session.metadata.supabaseUUID;
          const subscription_id = session.subscription;

          await (supabase
            .from('profiles') as any)
            .update({ 
              is_verified: true, 
              plan_type: 'premium',
              stripe_subscription_id: subscription_id 
            } as any)
            .eq('id', user_id);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const user_id = subscription.metadata.supabaseUUID;

          await (supabase
            .from('profiles') as any)
            .update({ 
              is_verified: false, 
              plan_type: 'free',
              stripe_subscription_id: null 
            } as any)
            .eq('id', user_id);
          break;
        }
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.error('Webhook handler failed:', error);
      return new NextResponse('Webhook handler failed', { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
