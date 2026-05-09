// utils/emailTemplates.ts or in your existing email templates file
export const receiptEmailTemplate = (
  invoice: any, // Stripe invoice object
  subscription: any // Your subscription data
) => {
  const formattedDate = new Date(invoice.created * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedAmount = (invoice.amount_paid / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: invoice.currency.toUpperCase()
  });

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7fa; color: #333333;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border: 0; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eeeeee;">
                            <h1 style="margin: 0; font-size: 24px; color: #333333;">Payment Receipt</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; color: #666666;">Thank you for your payment!</p>
                        </td>
                    </tr>
                    
                    <!-- Receipt Details -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                <!-- Receipt Info -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333;">
                                            <strong>Invoice Number:</strong> ${invoice.number || 'N/A'}
                                        </p>
                                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333;">
                                            <strong>Date:</strong> ${formattedDate}
                                        </p>
                                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333;">
                                            <strong>Status:</strong> 
                                            <span style="color: #10b981; font-weight: bold;">${invoice.status?.toUpperCase() || 'PAID'}</span>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Payment Summary -->
                                <tr>
                                    <td style="padding: 25px 0; border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee;">
                                        <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333333;">Payment Summary</h2>
                                        
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 16px; color: #555555;">Plan:</span>
                                                </td>
                                                <td align="right" style="padding: 8px 0;">
                                                    <span style="font-size: 16px; color: #333333; font-weight: bold;">${subscription?.plan?.displayName || 'Subscription Plan'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 16px; color: #555555;">Billing Period:</span>
                                                </td>
                                                <td align="right" style="padding: 8px 0;">
                                                    <span style="font-size: 16px; color: #333333;">${subscription?.duration || 'Monthly'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 16px; color: #555555;">Amount Paid:</span>
                                                </td>
                                                <td align="right" style="padding: 8px 0;">
                                                    <span style="font-size: 20px; color: #4a6ee0; font-weight: bold;">${formattedAmount}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Subscription Details -->
                                <tr>
                                    <td style="padding-top: 25px;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333;">Subscription Details</h3>
                                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                                            Your subscription is now active. You'll be billed automatically at the end of each billing period.
                                        </p>
                                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                                            <strong>Next Billing Date:</strong> 
                                            ${subscription?.currentPeriodEnd 
                                              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric'
                                                })
                                              : 'Will be notified before renewal'
                                            }
                                        </p>
                                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                                            <strong>Subscription ID:</strong> ${subscription?.id || 'N/A'}
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Action Button -->
                                <tr>
                                    <td align="center" style="padding-top: 30px;">
                                        <a href="${invoice.hosted_invoice_url || '#'}" 
                                           style="display: inline-block; padding: 14px 32px; background-color: #4a6ee0; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; transition: background-color 0.3s;"
                                           onmouseover="this.style.backgroundColor='#3a5ed0'"
                                           onmouseout="this.style.backgroundColor='#4a6ee0'">
                                           View Invoice
                                        </a>
                                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #777777;">
                                            Click above to download a PDF version of your invoice
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #eeeeee; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                <tr>
                                    <td style="color: #777777; font-size: 13px; text-align: center;">
                                        <p style="margin: 0 0 10px 0;">
                                            Need help? Contact our support team at 
                                            <a href="mailto:support@yourcompany.com" style="color: #4a6ee0; text-decoration: none;">support@yourcompany.com</a>
                                        </p>
                                        <p style="margin: 0 0 10px 0;">
                                            To manage your subscription, visit your account dashboard.
                                        </p>
                                        <p style="margin: 0;">
                                            &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};