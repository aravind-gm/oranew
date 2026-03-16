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
    gstAmount?: number;
    shippingCost?: number;
    discountAmount?: number;
}
/**
 * Send order placed email — Luxury Rose Gold theme
 */
export declare const sendOrderPlacedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order confirmed email — Luxury Rose Gold theme
 */
export declare const sendOrderConfirmedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order shipped email — Luxury Rose Gold theme
 */
export declare const sendOrderShippedEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send order delivered email — Luxury Rose Gold theme
 */
export declare const sendOrderDeliveredEmail: (data: OrderEmailData) => Promise<void>;
/**
 * Send abandoned cart reminder email — Luxury Rose Gold theme
 */
export declare const sendAbandonedCartEmail: (data: {
    customerEmail: string;
    customerName: string;
    items: Array<{
        productName: string;
        unitPrice: number;
        quantity: number;
    }>;
    cartTotal: number;
}) => Promise<void>;
/**
 * Day 2 — Shipping Reassurance Email
 * Builds trust while the order is in transit.
 */
export declare const sendShippingReassuranceEmail: (data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    courierName?: string;
}) => Promise<void>;
/**
 * Day 7 — Review Request Email
 * Asks for a review after the customer has had time to try the product.
 */
export declare const sendReviewRequestEmail: (data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    items: Array<{
        productName: string;
        productSlug?: string;
    }>;
}) => Promise<void>;
/**
 * Day 21 — Reorder / Browse Again Suggestion
 * Gentle reminder with new arrivals or complementary pieces.
 */
export declare const sendReorderSuggestionEmail: (data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
}) => Promise<void>;
declare const _default: {
    sendOrderPlacedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderConfirmedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderShippedEmail: (data: OrderEmailData) => Promise<void>;
    sendOrderDeliveredEmail: (data: OrderEmailData) => Promise<void>;
    sendAbandonedCartEmail: (data: {
        customerEmail: string;
        customerName: string;
        items: Array<{
            productName: string;
            unitPrice: number;
            quantity: number;
        }>;
        cartTotal: number;
    }) => Promise<void>;
    sendShippingReassuranceEmail: (data: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        trackingNumber?: string;
        courierName?: string;
    }) => Promise<void>;
    sendReviewRequestEmail: (data: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
        items: Array<{
            productName: string;
            productSlug?: string;
        }>;
    }) => Promise<void>;
    sendReorderSuggestionEmail: (data: {
        customerEmail: string;
        customerName: string;
        orderNumber: string;
    }) => Promise<void>;
};
export default _default;
//# sourceMappingURL=email.service.d.ts.map