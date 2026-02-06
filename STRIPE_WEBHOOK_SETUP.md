# Stripe Webhook Setup Guide

## Running Stripe Webhooks Locally

To test Stripe webhooks in your local development environment, you need to use the Stripe CLI to forward webhook events to your local server.

### Prerequisites

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open your browser to authenticate with your Stripe account.

### Running the Webhook Forwarding

#### Option 1: Using npm script (Recommended)
```bash
npm run stripe:webhook
```

#### Option 2: Using Stripe CLI directly
```bash
stripe listen --forward-to localhost:3000/api/stripe
```

### Getting the Webhook Secret

When you run the webhook forwarding command, Stripe CLI will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Important:** Copy this secret and add it to your `.env.local` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Testing Webhooks

1. **Start your Next.js dev server** (in one terminal):
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in another terminal):
   ```bash
   npm run stripe:webhook
   ```

3. **Make a test payment** - Complete a checkout flow, and you should see webhook events in the Stripe CLI terminal.

### Webhook Events Handled

Your application handles these Stripe webhook events:
- `checkout.session.completed` - Creates an order when payment is successful
- `payment_intent.payment_failed` - Logs failed payment attempts

### Troubleshooting

- **Webhook not receiving events?** Make sure:
  - Your Next.js server is running on `localhost:3000`
  - The webhook forwarding command is running
  - The `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from Stripe CLI

- **Webhook signature verification failed?** 
  - Make sure you're using the correct webhook secret from the Stripe CLI output
  - Restart your Next.js server after updating `.env.local`

- **Events not showing in CLI?**
  - Check that you're using test mode in Stripe
  - Verify the webhook endpoint URL is correct: `http://localhost:3000/api/stripe`

### Production Webhooks

#### Understanding the Difference

**Important:** The order confirmation page and webhook endpoint are **two different things**:

1. **Order Confirmation Page** (`/checkout/success`)
   - This is what the **user sees** in their browser after completing payment
   - It's a regular Next.js page that displays order details
   - The user is redirected here by Stripe after payment
   - This page **reads** order data from your database

2. **Webhook Endpoint** (`/api/stripe`)
   - This is a **server-to-server** API route that Stripe calls directly
   - Stripe calls this endpoint **in the background** (not through the user's browser)
   - This endpoint **creates** the order in your database when payment is confirmed
   - The user never directly accesses this endpoint

#### How It Works

```
User Flow:
1. User completes payment on Stripe Checkout
2. Stripe redirects user to: https://yoursite.com/checkout/success?session_id=...
3. User sees order confirmation page

Background Process (Webhook):
1. Stripe sends webhook event to: https://yoursite.com/api/stripe
2. Your server receives the webhook and creates the order in database
3. Order confirmation page polls/reads the order from database
```

#### Setting Up Production Webhooks

1. **Deploy your application** to production (Vercel, AWS, etc.)

2. **Configure webhook in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Enter your production webhook URL: `https://yoursite.com/api/stripe`
   - Select events to listen for:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
   - Click "Add endpoint"

3. **Get the webhook signing secret**:
   - After creating the endpoint, click on it
   - Find "Signing secret" section
   - Click "Reveal" and copy the secret (starts with `whsec_`)

4. **Add to production environment variables**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_from_dashboard
   ```

5. **Test the webhook**:
   - Use Stripe's "Send test webhook" feature in the dashboard
   - Or complete a real test payment
   - Check your server logs to verify the webhook is received

#### Why Webhooks Are Necessary

- **Reliability**: Webhooks ensure your server is notified even if the user closes their browser
- **Security**: Webhook signature verification ensures the request is actually from Stripe
- **Asynchronous**: Order creation happens in the background, so the user doesn't wait
- **Idempotency**: Webhooks can be retried if your server is temporarily down

#### Common Production Issues

- **Webhook not receiving events?**
  - Ensure your production server is publicly accessible (not behind a firewall)
  - Check that the webhook URL in Stripe Dashboard matches your production URL exactly
  - Verify SSL certificate is valid (Stripe requires HTTPS in production)

- **Webhook signature verification failing?**
  - Make sure you're using the production webhook secret (not the CLI test secret)
  - Ensure `STRIPE_WEBHOOK_SECRET` environment variable is set correctly in production

- **Orders not being created?**
  - Check server logs for webhook processing errors
  - Verify database connection is working in production
  - Check Stripe Dashboard → Webhooks → Your endpoint → Recent events for delivery status
