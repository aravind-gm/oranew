import { redirect } from 'next/navigation';

export default function Offers() {
  redirect('/collections?promo=true');
}
