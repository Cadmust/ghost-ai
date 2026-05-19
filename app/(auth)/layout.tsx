import AuthSidebar from "@/components/ui/auth-sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-950">
      <AuthSidebar />
      {/* Right panel - form section */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-neutral-900">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}