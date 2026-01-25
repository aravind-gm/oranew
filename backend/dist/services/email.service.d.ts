interface OrderEmailData {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
    }>;
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
    };
    trackingNumber?: string;
    courierName?: string;
}
/**
 * Send order placed email to customer
 */
export declare const sendOrderPlacedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order confirmed email (after admin manual confirmation)
 */
export declare const sendOrderConfirmedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order shipped email with tracking info
 */
export declare const sendOrderShippedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order delivered email
 */
export declare const sendOrderDeliveredEmail: (data: OrderEmailData) => Promise<void>;
declare const _default: {
    sendOrderPlacedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderConfirmedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderShippedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderDeliveredEmail: (data: OrderEmailData) => Promise<void>;
};
export default _default;
//# sourceMappingURL=email.service.d.ts.map