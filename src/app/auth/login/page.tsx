import LibrarianLoginForm from '@/components/tenant/LibrarianLoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_50%,_#eef5ff_100%)] p-6">
      <div className="w-full max-w-md">
        <LibrarianLoginForm />
      </div>
    </main>
  );
}
