/**
 * VatFlow API Client
 * Official Node.js wrapper for https://rapidapi.com/vatflow-eu-vat-company-monitor
 */
class VatFlowClient {
  /**
   * @param {string} apiKey - Your RapidAPI Key
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("VatFlow API Key is required.");
    }
    this.apiKey = apiKey;
    this.host = 'vatflow-eu-vat-company-monitor.p.rapidapi.com';
    this.baseUrl = `https://${this.host}`;
  }

  /**
   * Helper interne pour gérer les requêtes et les retries
   */
  async _request(endpoint, options = {}, retry = true) {
    const maxAttempts = retry ? 3 : 1;
    let attempt = 1;
    let lastError = null;
    let response = null;

    const headers = {
      'x-rapidapi-host': this.host,
      'x-rapidapi-key': this.apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    while (attempt <= maxAttempts) {
      try {
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers
        });

        // Si succès (2xx) ou erreur client (4xx), on ne retry pas !
        if (response.status < 500) {
          return await this._decodeResponse(response);
        }

        // Si erreur >= 500 (Panne serveur temporaire), on laisse la boucle réessayer.
      } catch (error) {
        // Erreur réseau (timeout, DNS, etc.)
        lastError = error;
      }

      if (attempt < maxAttempts) {
        // Attente progressive (1s puis 2s)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
      attempt++;
    }

    // Si on a eu une réponse 5xx après tous les retries
    if (response !== null) {
        return await this._decodeResponse(response);
    }

    // Si erreur réseau pure sans jamais joindre le serveur
    return {
      success: false,
      error: `Network error after ${maxAttempts} attempts: ${lastError.message}`,
      status_code: 0
    };
  }

  async _decodeResponse(response) {
    const rawText = await response.text();
    let decoded;

    try {
      decoded = JSON.parse(rawText);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid JSON response from server.',
        status_code: response.status,
        raw_body: rawText
      };
    }

    // Gestion des erreurs natives de RapidAPI (qui ne contiennent pas la clé 'success')
    if (decoded.success === undefined) {
      return {
        success: false,
        error: decoded.message || 'Unknown error from RapidAPI Gateway.',
        status_code: response.status,
        raw_response: decoded
      };
    }

    return decoded;
  }

  /**
   * Validate an EU VAT number and enrich company data.
   * @param {string} vat - The VAT number
   * @param {number} maxCacheDays - Max age of cached data (default: 7)
   * @param {boolean} retry - Auto-retry on 5xx errors (default: true)
   */
  async validate(vat, maxCacheDays = 7, retry = true) {
    const params = new URLSearchParams({ 
      vat: vat, 
      max_cache_days: maxCacheDays 
    });
    return this._request(`/vat?${params.toString()}`, { method: 'GET' }, retry);
  }

  /**
   * List all active webhook subscriptions.
   */
  async listWebhooks() {
    return this._request('/webhooks', { method: 'GET' });
  }

  /**
   * Subscribe to a VAT number to receive Webhook alerts.
   * @param {string} vat - The VAT number to monitor
   * @param {string} webhookUrl - Your webhook receiver URL
   */
  async subscribeWebhook(vat, webhookUrl) {
    return this._request('/webhooks/subscribe', {
      method: 'POST',
      body: JSON.stringify({ vat, webhook_url: webhookUrl })
    });
  }

  /**
   * Delete an active Webhook subscription.
   * @param {string} vat - The VAT number
   * @param {string} subscriptionId - The ID of the subscription
   */
  async deleteWebhook(vat, subscriptionId) {
    return this._request('/webhooks/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ vat, subscription_id: subscriptionId })
    });
  }
}

module.exports = VatFlowClient;