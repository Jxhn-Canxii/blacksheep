import { NextResponse } from 'next/server';
import { stripe } from '@/libs/stripe';
import { createClient } from '@/libs/supabaseServer';

export async function POST(req: Request) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_VERIFIED_PLAN !== 'true') {
      return new NextResponse('Feature Disabled', { status: 403 });
    }

    const { priceId } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get profile data
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await (supabase
        .from('profiles') as any)
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/ledger?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/ledger?canceled=true`,
      metadata: {
        supabaseUUID: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('STRIPE_CHECKOUT_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
