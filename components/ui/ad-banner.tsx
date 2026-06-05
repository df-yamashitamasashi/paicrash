import { PromoBanner } from './promo-banner';
import { RecruitBanner } from './recruit-banner';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  return (
    <div className={cn("flex flex-col gap-2 w-full min-w-0", className)}>
      <PromoBanner />
      <RecruitBanner />
    </div>
  );
}
