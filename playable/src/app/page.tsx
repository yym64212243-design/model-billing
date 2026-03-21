import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold text-white">Playable</span>
          <nav className="flex gap-4">
            <Link href="/input" className="text-sm text-gray-400 hover:text-white">
              开始制作
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-12 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <HeroSection />
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-lg font-medium text-white">核心亮点</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-playable-accent/20 text-playable-accent">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-medium text-white">上传或录音</h3>
              <p className="mt-1 text-sm text-gray-400">支持上传音频文件或直接录制环境中的音乐</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-playable-accent/20 text-playable-accent">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <h3 className="font-medium text-white">瀑布流可视化</h3>
              <p className="mt-1 text-sm text-gray-400">下落式方块对应键位与音长，跟弹更直观</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-playable-accent/20 text-playable-accent">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-medium text-white">iPad 琴架跟弹</h3>
              <p className="mt-1 text-sm text-gray-400">开启麦克风监听，实时识别弹奏并同步反馈</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-sm text-gray-500">
        Playable — 把喜欢的歌变成能弹的钢琴
      </footer>
    </main>
  );
}
