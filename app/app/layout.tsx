import { AppSidebar } from "@/components/app/app-sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 bg-background transition-[background-color,color] duration-300 ease-out">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col transition-[background-color,color] duration-300 ease-out">
        <main className="flex-1 overflow-auto transition-[background-color,color] duration-300 ease-out">
          <div className="mx-auto max-w-[900px] px-8 py-10 md:px-20 md:py-14 transition-[background-color,color] duration-300 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
