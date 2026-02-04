import { redirect } from 'next/navigation';

export default function NewArrivals() {
  redirect('/collections?sort=-createdAt');
}
