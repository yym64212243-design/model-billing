import HomeNav from '@/components/HomeNav';
import HomePageMain from '@/components/HomePageMain';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_24%,#f8fbff_100%)] text-gray-900">
      <HomeNav />
      <HomePageMain />
    </div>
  );
}
