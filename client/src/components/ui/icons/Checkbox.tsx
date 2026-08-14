import type { IconProps } from '@/types';

type CheckboxIconProps = IconProps & {
  checked?: boolean;
};

const CheckboxIcon = ({ checked = false, ...props }: CheckboxIconProps) => (
  <svg
    {...props}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect
      x="1.25"
      y="1.25"
      width="13.5"
      height="13.5"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
      fill={checked ? 'currentColor' : 'none'}
    />
    {checked ? (
      <path
        d="M4.5 8.1 6.8 10.4 11.5 5.6"
        stroke="#211a2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
  </svg>
);

export default CheckboxIcon;
