import DashboardSidebar from '@/components/DashboardSidebar';

export default function OpenClawLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_32%,#eef4ff_100%)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>
      <DashboardSidebar />
      <div className="relative lg:pl-72">
        <main className="min-h-screen pt-14 lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
