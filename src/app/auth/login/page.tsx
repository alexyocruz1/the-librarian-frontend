import LibrarianLoginForm from '@/components/tenant/LibrarianLoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_rgba(255,250,240,0.75)_0%,_rgba(255,255,255,0.85)_50%,_rgba(238,245,255,0.75)_100%)] p-6">
      <div className="w-full max-w-md">
        <LibrarianLoginForm />
      </div>
    </main>
  );
}
