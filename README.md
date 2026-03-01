# VatFlow Node.js SDK

The official Node.js client for the [VatFlow - EU VAT & Company Monitor](https://rapidapi.com/BaptistePignol/api/vatflow-eu-vat-company-monitor) API on RapidAPI.

VatFlow allows you to instantly validate European VAT numbers via VIES, enrich French company profiles (financials, executives, UBOs), and set up webhooks to monitor businesses for critical status changes.

## Requirements

* Node.js 18.0 or higher (uses native `fetch`)
* A RapidAPI account and API key

## Installation

You can install the package via npm:

```bash
npm install vatflow

```

## Quick Start

To use the API, you need your RapidAPI key. You can find it in your RapidAPI Studio dashboard after subscribing to the VatFlow API.

```javascript
const VatFlowClient = require('vatflow');

// Initialize the client
const client = new VatFlowClient('YOUR_RAPIDAPI_KEY');

```

## Usage

All methods are asynchronous and return a standard JavaScript object decoded from the JSON response. You can check the `success` property to determine if the API call was successful.

### 1. Validate and Enrich a VAT Number

The `validate` method checks a VAT number and retrieves the company data.

**Built-in Auto-Retry:** By default, this SDK includes a robust auto-retry mechanism. If the government server (VIES) or the network experiences a temporary failure (HTTP 5xx), the client will automatically wait and retry up to 3 times before failing.

```javascript
async function checkCompany() {
    const vatNumber = 'FR14652014051';
    const maxCacheDays = 7; // Request data no older than 7 days (default)
    const autoRetry = true; // Automatically retry on 5xx network errors (default)

    const response = await client.validate(vatNumber, maxCacheDays, autoRetry);

    if (response.success) {
        console.log("Company Name:", response.data.name);
        console.log("Address:", response.data.address);
        console.log("Is Valid:", response.data.is_valid ? 'Yes' : 'No');
    } else {
        console.error("Error:", response.error);
    }
}

checkCompany();

```

### 2. Subscribe to Webhook Alerts

Register a webhook URL to be notified proactively if a company's status or data changes.

```javascript
async function monitorCompany() {
    const vatNumber = 'FR14652014051';
    const webhookUrl = 'https://api.yourdomain.com/webhooks/vatflow';

    const response = await client.subscribeWebhook(vatNumber, webhookUrl);

    if (response.success) {
        console.log("Subscribed! Subscription ID:", response.data.subscription_id);
    }
}

```

### 3. List Active Webhooks

Retrieve a list of all VAT numbers you are currently monitoring.

```javascript
async function getMyWebhooks() {
    const response = await client.listWebhooks();

    if (response.success) {
        console.log(`You have ${response.count} active webhooks.`);
        console.log(response.data);
    }
}

```

### 4. Delete a Webhook

Unsubscribe from alerts for a specific VAT number.

```javascript
async function removeWebhook() {
    const vatNumber = 'FR14652014051';
    const subscriptionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    const response = await client.deleteWebhook(vatNumber, subscriptionId);

    if (response.success) {
        console.log("Webhook successfully deleted.");
    }
}

```

## Error Handling

The client handles JSON decoding and basic network exceptions. If a request fails at the API level (e.g., invalid VAT format, missing parameters, or exceeding your RapidAPI quota), the method will return an object with `success` set to `false` and an `error` message.

```javascript
{
  success: false,
  error: "The VAT number format is invalid for this country.",
  status_code: 400
}

```

## License

This project is licensed under the MIT License.