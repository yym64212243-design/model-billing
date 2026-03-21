import { getAuthorizedOrderResponse } from '@/lib/order-response';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  return getAuthorizedOrderResponse(params.id);
}
