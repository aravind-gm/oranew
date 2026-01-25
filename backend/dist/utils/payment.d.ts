import Razorpay from 'razorpay';
export declare const razorpay: Razorpay;
export declare const createRazorpayOrder: (amountInRupees: number, receipt: string) => Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
export declare const verifyRazorpaySignature: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => boolean;
export declare const verifyWebhookSignature: (rawBody: string, receivedSignature: string) => boolean;
//# sourceMappingURL=payment.d.ts.map