import { choice, number, object, phone, text, uuid, HttpError } from './validation';

export function orderInput(body: Record<string, unknown>) {
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) throw new HttpError(400, 'Add between 1 and 100 products');
  const items = body.items.map(value => {
    const item = object(value, ['product_id', 'qty', 'price']);
    return { product_id: uuid(item.product_id, 'product'), qty: number(item.qty, 'quantity', 1, 9999, true),
      ...(item.price === undefined ? {} : { price: number(item.price, 'price', 0, 1_000_000) }) };
  });
  if (new Set(items.map(item => item.product_id)).size !== items.length) throw new HttpError(400, 'Duplicate products are not allowed');
  return {
    p_items: items,
    p_customer_name: text(body.customer_name, 'customer name', 200, true),
    p_customer_phone: phone(body.customer_phone, true),
    p_discount_percent: number(body.discount_percent ?? 0, 'discount', 0, 100),
    p_payment_method: choice(body.payment_method, ['cash', 'upi', 'card'] as const, 'payment method'),
    p_request_id: uuid(body.request_id, 'request ID'),
  };
}
