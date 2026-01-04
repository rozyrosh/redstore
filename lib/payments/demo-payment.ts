/**
 * Demo Payment System
 * 
 * This is a temporary payment system for development/testing.
 * In production, this should be replaced with PayHere integration.
 */

export interface DemoPaymentResult {
  success: boolean
  transaction_id: string
  payment_token?: string
  message: string
}

/**
 * Process a demo payment
 * Always succeeds for demo purposes
 */
export async function processDemoPayment(
  amount: number,
  orderId: string,
  saveToken: boolean = false
): Promise<DemoPaymentResult> {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate fake transaction ID
  const transactionId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  // Generate fake payment token if user wants to save it
  const paymentToken = saveToken
    ? `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
    : undefined

  return {
    success: true,
    transaction_id: transactionId,
    payment_token: paymentToken,
    message: 'Payment processed successfully (Demo Mode)',
  }
}

/**
 * Validate demo payment token
 */
export function validateDemoToken(token: string): boolean {
  return token.startsWith('demo_token_')
}

