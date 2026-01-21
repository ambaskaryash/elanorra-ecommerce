# Odoo Integration Plan for Elanorra E-Commerce

## What is Odoo?
Odoo is a comprehensive Open Source ERP (Enterprise Resource Planning) software. It manages key business operations in one place:
- **Inventory**: Stock levels, warehouses, variants.
- **Sales/CRM**: Customer data, quotations, sales orders.
- **Accounting**: Invoicing, payments, tax reports.
- **Website/eCommerce**: (We are replacing this part with our custom Next.js frontend).

## Why Integrate?
By connecting our Next.js storefront to Odoo, we get:
1.  **Professional Backend**: Use Odoo's UI to manage products, prices, and stock instead of editing our database directly.
2.  **Automated Accounting**: Orders automatically generate invoices and revenue entries.
3.  **Real-time Inventory**: Prevent selling out-of-stock items by checking Odoo's live inventory.

## Integration Architecture

### 1. Technology Stack
- **Protocol**: **XML-RPC** (Odoo's standard external API protocol).
- **Client**: We will build a lightweight service in `src/lib/odoo` using a Node.js XML-RPC library.
- **Auth**: API Key / Password authentication.

### 2. Data Flow Strategy

#### A. Products (Odoo -> Next.js)
*   **Source of Truth**: Odoo.
*   **Sync Method**:
    *   *Periodic Sync*: An Admin API route (`/api/admin/sync/products`) fetches product data from Odoo and updates our Prisma (Postgres) database.
    *   *Benefit*: Keeps the storefront fast (fetching from local DB) while keeping data managed in Odoo.

#### B. Inventory (Odoo <-> Next.js)
*   **Real-time Check**: On the "Checkout" page, we query Odoo API directly to ensure stock is available before payment.
*   **Reservation**: (Optional) Temporarily reserve stock during checkout.

#### C. Orders (Next.js -> Odoo)
*   **Trigger**: Webhook from Razorpay (Payment Success).
*   **Action**:
    1.  Create Order in local Prisma DB (for user history).
    2.  **Push to Odoo**: Create a "Sales Order" in Odoo via API.
    3.  **Customer**: Create or Link the customer in Odoo based on email.

## Implementation Steps

1.  **Scaffold Service**: Create `src/lib/odoo/client.ts` to handle authentication and connection.
2.  **Product Sync**: Implement `fetchProductsFromOdoo()` to map Odoo fields (`product.template`) to our Prisma schema.
3.  **Order Push**: Implement `createOdooOrder()` to translate our Cart/Order object into Odoo's `sale.order` format.
4.  **Webhooks**: Connect the Razorpay success webhook to trigger the Odoo order creation.

## Environment Variables Required
```env
ODOO_URL="https://your-odoo-instance.com"
ODOO_DB="your-database-name"
ODOO_USERNAME="admin_email"
ODOO_PASSWORD="api_key_or_password"
```

## How to Get Odoo Credentials

### 1. Odoo Database (ODOO_DB)
- Look at your Odoo URL: `https://elanorra.odoo.com`
- The database name is usually the first part: `elanorra`
- If you have multiple databases, you can find it in the login screen selector.

### 2. Username (ODOO_USERNAME)
- This is simply the **Email Address** you use to log in to Odoo.

### 3. API Key (ODOO_PASSWORD)
*Do not use your regular login password. Generate an API Key instead.*

1.  Log in to your Odoo instance.
2.  Click on your **Profile Icon** (top right corner) -> **Preferences** (or "My Profile").
3.  Go to the **Account Security** tab.
4.  Under **API Keys**, click **New API Key**.
5.  Give it a description (e.g., "Next.js Integration").
6.  **Copy the key immediately**. You won't be able to see it again.
7.  Paste this key into your `.env` file as `ODOO_PASSWORD`.

