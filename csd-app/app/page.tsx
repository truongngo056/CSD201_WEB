import { HeroSection } from "@/components/home/hero-section";
import { BentoGrid } from "@/components/home/bento-grid";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 sm:py-12">
      <HeroSection />
      <BentoGrid />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Animation thời gian thực",
            desc: "Mọi bước thêm, xóa, xoay, heapify được vẽ mượt với chuyển động rõ ràng.",
            emoji: "✨",
          },
          {
            title: "Java + Giả mã",
            desc: "Đọc code Java sạch, kèm giả mã và độ phức tạp — highlight dòng đang chạy.",
            emoji: "💻",
          },
          {
            title: "Học có gamification",
            desc: "Nhận XP, mở thành tựu, theo dõi tiến độ và tự kiểm tra bằng quiz.",
            emoji: "🎮",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-lg"
          >
            <span className="text-2xl">{f.emoji}</span>
            <h3 className="mt-2 font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
