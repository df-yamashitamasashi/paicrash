'use client';

import * as React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const rootClass = (className?: string) => ['inline-block', className].filter(Boolean).join(' ');

function TileBase() {
  return (
    <g>
      {/* Pop 3D Shadow */}
      <rect x="3" y="5" width="18" height="16" rx="5" fill="currentColor" opacity="0.15" />
      {/* Main tile frame */}
      <rect x="3" y="3" width="18" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Inner highlight */}
      <rect x="6" y="6" width="12" height="10" rx="3" fill="currentColor" opacity="0.08" />
    </g>
  );
}

export function TileLogoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={rootClass(className)}
      {...props}
    >
      {/* Pop 3D Shadow */}
      <rect x="3" y="5" width="18" height="16" rx="5" fill="currentColor" opacity="0.15" />
      {/* Main frame */}
      <rect x="3" y="3" width="18" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      
      {/* Coffee Cup body (Pins-like circle base with flat top and bottom) */}
      <path d="M7 11.5c0 3.2 2 4.5 5 4.5s5-1.3 5-4.5H7z" fill="currentColor" opacity="0.8" />
      {/* Cup handle */}
      <path d="M17 11.5c1.2 0 2 .5 2 1.5s-.8 1.5-2 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Saucer / Plate */}
      <path d="M6 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Steam rising (elegant minimalist waves) */}
      <path d="M9.5 8c0-1.5 1-1.5 1-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 8c0-1.5 1-1.5 1-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SinglePlayerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
      <path d="M8.5 16.5c1.2-1 2.8-1 4 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MultiplayerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <circle cx="8.5" cy="10" r="2" fill="currentColor" />
      <circle cx="15.5" cy="10" r="2" fill="currentColor" />
      <path d="M6 16c1.3-1.2 3.7-1.2 5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 16c1.3-1.2 3.7-1.2 5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function GuideIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16.5" cy="8.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ConnectIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 14c1.333-1.333 3.333-1.333 4.667 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9.5 16.5c0.833-0.833 1.833-0.833 2.667 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function LeaveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 9l3 3-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M7 8h10M7 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 16.5c0-.83.67-1.5 1.5-1.5h11c.83 0 1.5.67 1.5 1.5v1.5l-2 2h-9c-.83 0-1.5-.67-1.5-1.5v-2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReadyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 13l2.5 2.5L16 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CancelIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
    </svg>
  );
}

export function AddIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function JoinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M10 8l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 12H7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function DisconnectIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 10l4 4M18 10l-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HostCrownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M7 15l2.5-5 2.5 4 2.5-4 2.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 15h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M11 7.5a2.5 2.5 0 1 1 5 0c0 1.38-1 2-2 2-1 0-2 .5-2 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17h0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SuitTileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <circle cx="12" cy="8" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

export function HonorTileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M12 7l3 10H9l3-10z" fill="currentColor" />
      <path d="M10.5 15.5h3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SpecialTileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M8 8h8M8 12h8M8 16h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function YakumanIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={rootClass(props.className)} {...props}>
      <TileBase />
      <path d="M7 15l2.5-7 2.5 4 2.5-4L17 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 15h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
