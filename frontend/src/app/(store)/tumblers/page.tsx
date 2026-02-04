import { redirect } from 'next/navigation';

export default function Tumblers() {
  redirect('/collections?category=tumblers');
}
