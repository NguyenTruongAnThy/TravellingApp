import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
}

export function BeachIcon({ color = '#FFFFFF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.00002 2V14M8.00002 2C5.66669 2 2.66669 4.66667 2.66669 7.33333H13.3334C13.3334 4.66667 10.3334 2 8.00002 2V2M4.66669 14H11.3334"
        strokeWidth="1.47"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function MountainIcon({ color = '#131B2E', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G clipPath="url(#clip0_mountain)">
        <Path
          d="M2 12.6667L6.33333 5.33333L9.33333 10.3333L12 5.99999L15.3333 12.6667H2V12.6667"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_mountain">
          <Rect width="16" height="16" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export function CampingIcon({ color = '#131B2E', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 13.3333L8 2.66667L14 13.3333H2V13.3333M8 2.66667V13.3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function CountrysideIcon({ color = '#131B2E', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 8L3.33333 6.66667M3.33333 6.66667L8 2L12.6667 6.66667M3.33333 6.66667V13.3333C3.33333 13.7013 3.63206 14 4 14H6M12.6667 6.66667L14 8M12.6667 6.66667V13.3333C12.6667 13.7013 12.3679 14 12 14H10M6 14C6.36794 14 6.66667 13.7013 6.66667 13.3333V10.6667C6.66667 10.2987 6.96539 10 7.33333 10H8.66667C9.03461 10 9.33333 10.2987 9.33333 10.6667V13.3333C9.33333 13.7013 9.63206 14 10 14M6 14H10"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function CitiesIcon({ color = '#131B2E', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12.6667 14V3.33333C12.6667 2.59745 12.0692 2 11.3333 2H4.66667C3.93078 2 3.33333 2.59745 3.33333 3.33333V14M12.6667 14H14M12.6667 14H9.33333M3.33333 14H2M3.33333 14H6.66667M6 4.66667H6.66667M6 7.33333H6.66667M9.33333 4.66667H10M9.33333 7.33333H10M6.66667 14V10.6667C6.66667 10.2987 6.96539 10 7.33333 10H8.66667C9.03461 10 9.33333 10.2987 9.33333 10.6667V14M6.66667 14H9.33333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function LakefrontIcon({ color = '#131B2E', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G clipPath="url(#clip0_lake)">
        <Path
          d="M2 10C3.66667 10 3.66667 8.66667 5.33333 8.66667C7 8.66667 7 10 8.66667 10C10.3333 10 10.3333 8.66667 12 8.66667C13.6667 8.66667 13.6667 10 15.3333 10M2 12.6667C3.66667 12.6667 3.66667 11.3333 5.33333 11.3333C7 11.3333 7 12.6667 8.66667 12.6667C10.3333 12.6667 10.3333 11.3333 12 11.3333C13.6667 11.3333 13.6667 12.6667 15.3333 12.6667"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_lake">
          <Rect width="16" height="16" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export function BrandLogoPin({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 1.66667C6.77502 1.66667 4.16669 4.275 4.16669 7.5C4.16669 11.875 10 18.3333 10 18.3333C10 18.3333 15.8334 11.875 15.8334 7.5C15.8334 4.275 13.225 1.66667 10 1.66667V1.66667"
        strokeWidth="2.08"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
      <Path
        d="M7.91669 7.5C7.91669 8.64982 8.8502 9.58333 10 9.58333C11.1498 9.58333 12.0834 8.64982 12.0834 7.5C12.0834 6.35018 11.1498 5.41667 10 5.41667C8.8502 5.41667 7.91669 6.35018 7.91669 7.5V7.5"
        fill={color}
        strokeWidth="2.08"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function FilterSlidersIcon({ size = 16, color = '#5A6478' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7.99996 4V2.66666M7.99996 4C7.26407 4 6.66663 4.59744 6.66663 5.33333C6.66663 6.06922 7.26407 6.66666 7.99996 6.66666M7.99996 4C8.73585 4 9.33329 4.59744 9.33329 5.33333C9.33329 6.06922 8.73585 6.66666 7.99996 6.66666M3.99996 12C4.73585 12 5.33329 11.4026 5.33329 10.6667C5.33329 9.93078 4.73585 9.33333 3.99996 9.33333M3.99996 12C3.26407 12 2.66663 11.4026 2.66663 10.6667C2.66663 9.93078 3.26407 9.33333 3.99996 9.33333M3.99996 12V13.3333M3.99996 9.33333V2.66666M7.99996 6.66666V13.3333M12 12C12.7358 12 13.3333 11.4026 13.3333 10.6667C13.3333 9.93078 12.7358 9.33333 12 9.33333M12 12C11.2641 12 10.6666 11.4026 10.6666 10.6667C10.6666 9.93078 11.2641 9.33333 12 9.33333M12 12V13.3333M12 9.33333V2.66666"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}

export function NotificationBellIcon({ size = 16, color = '#131B2E' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.99996 11.3333H13.3333L12.3966 10.3967C12.1426 10.1426 11.9999 9.79797 12 9.43867V7.33333C12.0002 5.6378 10.9317 4.12622 9.33329 3.56067V3.33333C9.33329 2.59745 8.73585 2 7.99996 2C7.26407 2 6.66663 2.59745 6.66663 3.33333V3.56067C5.11329 4.11 3.99996 5.592 3.99996 7.33333V9.43933C3.99996 9.798 3.85729 10.1427 3.60329 10.3967L2.66663 11.3333H5.99996M9.99996 11.3333V12C9.99996 13.1038 9.10379 14 7.99996 14C6.89613 14 5.99996 13.1038 5.99996 12V11.3333M9.99996 11.3333H5.99996"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}
