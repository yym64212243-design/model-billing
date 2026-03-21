"use client";

import { TAGLINE } from "@/lib/constants";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-playable-primary to-playable-secondary px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(233,69,96,0.15),transparent)]" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Playable
        </h1>
        <p className="mt-4 text-lg text-gray-300 sm:text-xl lg:text-2xl">
          {TAGLINE}
        </p>
        <p className="mt-2 text-sm text-playable-muted">
          上传音频或直接录音，生成可弹的钢琴谱，用瀑布流跟弹，支持 iPad 琴架模式
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/input"
            className="touch-target inline-flex items-center justify-center rounded-xl bg-playable-accent px-8 py-4 text-base font-medium text-white shadow-lg transition hover:opacity-90"
          >
            上传音频
          </Link>
          <Link
            href="/input?tab=record"
            className="touch-target inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            直接录音
          </Link>
        </div>
      </div>
    </section>
  );
}
