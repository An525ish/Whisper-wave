/* eslint-disable global-require */
import plugin from 'tailwindcss/plugin';

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      primary: {
        DEFAULT: withOpacity('--color-primary'),
      },
      body: {
        DEFAULT: withOpacity('--color-text'),
        300: 'var(--color-text-300)',
        700: 'var(--color-text-700)',
      },
      background: {
        DEFAULT: withOpacity('--color-background'),
        alt: withOpacity('--color-background-alt'),
      },
      border: {
        DEFAULT: withOpacity('--color-border'),
      },
      white: {
        DEFAULT: '#EBECEC',
        pure: '#FFFFFF',
      },
      black: {
        DEFAULT: '#211A2A',
        light: '#2A2136',
        dark: '#1A1520',
        pure: 'rgba(0, 0, 0)',
        transparent: 'rgba(0, 0, 0, 0.5)',
      },
      grey: {
        DEFAULT: '#EBECEC4D',
        dark: '#646464',
        light: 'rgba(245, 245, 245, 0.5)',
      },
      green: {
        DEFAULT: '#01C36D',
        gradFrom: '#03AA69',
        gradTo: '#005E37',
        light: '#01C36D33',
        dark: '#1B3C37',
      },
      'green-light': {
        DEFAULT: '#01C36D33',
      },
      red: {
        DEFAULT: '#FF5863',
        light: '#FF586333',
        dark: '#4D2635',
      },
      yellow: {
        DEFAULT: '#ECC347',
        light: '#ECC34733',
      },
      gold: {
        DEFAULT: '#D4AA5A',
        400: '#D4AA5A66',
      },
      orange: {
        DEFAULT: '#FF9933',
        light: '#FF993333',
      },
      blue: {
        DEFAULT: '#5698FF',
        light: '#5698FF63',
      },
      transparent: 'transparent',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-dm-serif-display)', 'serif'],
      },
      boxShadow: {
        blue: '0 0 10px rgba(0, 0, 255, 0.8)',
        green: '0 0 10px rgba(0, 255, 0, 0.8)',
        orange: '0 0 10px rgba(255, 165, 0, 0.8)',
        glowBlue: '0 0 10px rgba(0, 0, 255, 0.8)',
        glowGreen: '0 0 10px rgba(0, 255, 0, 0.8)',
        glowOrange: '0 0 10px rgba(255, 165, 0, 0.8)',
      },
      animation: {
        spinning82341: 'spinning82341 1.7s linear infinite',
        hue: 'hue 1s ease-in-out infinite',
        loading: 'loading 9s linear infinite',
      },
      keyframes: {
        spinning82341: {
          to: {
            transform: 'rotate(360deg)',
          },
        },
        hue: {
          '0%': {
            filter: 'hue-rotate(0deg)',
          },
          '100%': {
            filter: 'hue-rotate(360deg)',
          },
        },
        loading: {
          '0%,100%': {
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            filter: 'hue-rotate(360deg)',
          },
        },
      },
      backgroundImage: {
        'gradient-background':
          'linear-gradient(90deg, #211a2a 0%, var(--color-background-gradient-start) 30%, var(--color-background-gradient-end) 70%, #211a2a 100%)',
        'gradient-green':
          'linear-gradient(180deg, #01C36D 0%, #01C16C 0.01%, #019C57 100%)',
        'gradient-linear-green':
          'linear-gradient(180deg, #03AA69 0%, #005E37 100%)',
        'gradient-idea-green':
          'linear-gradient(180deg, #74D680 0%, #378B29 100%)',
        'gradient-idea-blue':
          'linear-gradient(180deg, #09C6F920 0%, #045DE920 100%)',
        'gradient-idea-orange':
          'linear-gradient(145.73deg, #FF9933 3.96%, #D14545 100%)',
        'gradient-idea-gold':
          'linear-gradient(180deg, #E1B763 0%, #B18940 100%)',
        'gradient-dark-black':
          'linear-gradient(180deg, #393046 0%, #2D2537 100%)',
        'gradient-line-fade-dark':
          'linear-gradient(90deg, rgba(235, 236, 236, 0.00) 8.85%, rgba(235, 236, 236, 0.30) 48.96%, rgba(235, 236, 236, 0.00) 90.63%)',
        'gradient-line-fade-light':
          'linear-gradient(90deg, rgba(0, 0, 0, 0.00) 8.85%, rgba(0, 0, 0, 0.30) 48.96%, rgba(235, 236, 236, 0.00) 90.63%)',
        'gradient-black-landing':
          'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #000 23.65%, rgba(0, 0, 0, 0.00) 100%)',
        'gradient-text-balck':
          'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 159.72%)',
        'gradient-action-button-green':
          'linear-gradient(180deg, #1FA56A 0%, #16754B 100%)',
        'gradient-action-button-red':
          'linear-gradient(180deg, #CB525B 0%, #7A242A 100%)',
        'glass-background':
          'radial-gradient(at 47% 33%, hsl(161.45, 84%, 48%) 0, transparent 59%), radial-gradient(at 82% 65%, hsl(264, 21%, 14%) 0, transparent 55%)',
        'image-background':
          "url('https://images.unsplash.com/photo-1628498188904-036f5e25e93e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities(
        {
          '.scrollbar-hide': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          },
          '.scrollbar-default': {
            '-ms-overflow-style': 'auto',
            'scrollbar-width': 'auto',
            '&::-webkit-scrollbar': {
              display: 'block',
            },
          },
          // Custom scrollbar with no track and custom thumb
          '.scrollbar-custom': {
            '&::-webkit-scrollbar': {
              width: '12px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#4A5568', // Customize thumb color
              borderRadius: '6px',
              border: '3px solid transparent', // Add space around thumb
              backgroundClip: 'content-box', // Adjust thumb size
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent', // Hide track
            },
          },
        },
        ['responsive']
      );
    }),
  ],
};
