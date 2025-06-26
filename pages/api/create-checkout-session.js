const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_live_YOUR_SECRET_KEY_HERE');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  const { priceId, url } = req.body;
  if (!priceId || !url) {
    return res.status(400).json({ error: 'Missing priceId or url' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/scan-success?unlocked=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: { url },
    });
    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    return res.status(500).json({ error: 'Stripe Checkout error', details: err.message });
  }
}
