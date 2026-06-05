import { Sparkles, Gift, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoBannerProps {
  className?: string;
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <a 
      href="https://promojapan.jp/" 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn("block w-full min-w-0 relative group cursor-pointer", className)}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-300 via-rose-300 to-purple-300 rounded-xl blur-[2px] opacity-70 transition duration-500 group-hover:opacity-100"></div>
      <div className="relative w-full min-w-0 bg-white/90 dark:bg-card/90 backdrop-blur-sm border border-pink-200/50 rounded-xl p-3 flex flex-row items-center justify-between h-[80px] sm:h-[90px] shadow-sm overflow-hidden transition-colors hover:bg-white dark:hover:bg-card/95">
        <div className="absolute top-1.5 right-2.5 text-[9px] text-muted-foreground/50 uppercase tracking-widest font-semibold">Sponsor</div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="bg-pink-100 text-pink-600 p-2 sm:p-2.5 rounded-full flex-shrink-0 shadow-inner">
            <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          {/* Text Content */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-8 sm:pr-0">
            <span className="text-sm sm:text-base font-bold text-pink-600 flex items-center gap-1 truncate">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              コスメの無料モニターならPROMO
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
              最新の美容アイテムを無料で試せる！ポイントも貯まる♪
            </span>
          </div>
        </div>

        {/* Action Button (Desktop only) */}
        <div className="hidden sm:flex bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full items-center gap-1 flex-shrink-0 ml-2 group-hover:bg-pink-600 transition-colors">
          詳細を見る
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
}
