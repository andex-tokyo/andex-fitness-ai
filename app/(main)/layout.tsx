import Navigation from '@/components/Navigation'
import FAB from '@/components/FAB'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="pb-16 min-h-screen bg-gray-50">
        {children}
      </main>
      <Navigation />
      <FAB />
    </>
  )
}
