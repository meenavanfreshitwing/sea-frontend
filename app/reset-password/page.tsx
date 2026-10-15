import { redirect } from 'next/navigation';

// Customers log in with their phone number and a one-time code (no passwords),
// so old password links go straight to the login page.
export default function Page() {
  redirect('/login');
}
