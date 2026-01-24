export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendEmail: (options: EmailOptions) => Promise<void>;
export declare const getWelcomeEmailTemplate: (name: string) => string;
export declare const getPasswordResetEmailTemplate: (name: string, resetUrl: string) => string;
export declare const getOrderConfirmationTemplate: (orderNumber: string, totalAmount: number) => string;
export declare const getReturnApprovedTemplate: (name: string, orderNumber: string, returnId: string) => string;
export declare const getRefundProcessedTemplate: (name: string, orderNumber: string, refundAmount: number) => string;
//# sourceMappingURL=email.d.ts.map