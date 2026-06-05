import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({ children, showBack = true, withNav = true }) {
  return (
    <div className="min-h-screen bg-slate-100/60 flex justify-center">
      <div className="w-full max-w-2xl bg-slate-50 min-h-screen relative shadow-xl">
        <Header showBack={showBack} />
        <main className={`px-5 pt-4 ${withNav ? 'pb-28' : 'pb-8'}`}>
          {children}
        </main>
        {withNav && <BottomNav />}
      </div>
    </div>
  );
}
