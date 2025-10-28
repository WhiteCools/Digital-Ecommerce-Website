import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint (NO auth middleware - Stripe sends requests)
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Update order status
        try {
          const order = await Order.findOne({
            'paymentResult.id': paymentIntent.id,
          });

          if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult.status = 'succeeded';
            await order.save();
            console.log('✅ Order updated:', order._id);
          }
        } catch (error) {
          console.error('Error updating order:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.error('❌ Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

export default router;