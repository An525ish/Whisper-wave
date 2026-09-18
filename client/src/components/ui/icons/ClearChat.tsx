import type { IconProps } from '@/types';

const ClearChatIcon = ({ ...props }: IconProps) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 122.88 120.01"
    fill="currentColor"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M110.97,1.27 70.02,42.73l10.67,10.36 41.25-41.56C125.58,3.7 117.92-2.85 110.97,1.27zm-56.93,45.54c.4-.31.81-.58 1.22-.81l.15-.08c2.35-1.28 4.81-1.24 7.39.53l7.17 6.98.11.11 6.6,6.42c2.73,2.78 3.34,5.88 1.83,9.31L59.08,112.99C24.02,112.99-.34,87.94 0,49.73 19.23,55.35 37.75,57.19 54.04,46.81z"
    />
  </svg>
);

export default ClearChatIcon;
