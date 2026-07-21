import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-violet-500" />
          <span>
            <strong className="text-foreground">CSD201 Lab</strong> — Sân chơi
            cấu trúc dữ liệu tương tác
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Dành cho sinh viên · Học qua trực quan hóa
        </p>
      </div>
    </footer>
  );
}
