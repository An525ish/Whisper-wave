const VIBE_NAMES = [
  'midnight_fox',
  'blue_static',
  'chaos_agent',
  'soft_rain',
  'neon_ghost',
  'void_walker',
  'signal_lost',
  'quiet_riot',
  'burnt_sage',
  'paper_planes',
  'lost_signal',
  'cloud_nine',
  'echo_chamber',
  'silver_noise',
  'dark_matter',
  'flux_state',
  'purple_haze',
  'still_water',
];

const VibeNameTicker = () => {
  const items = [...VIBE_NAMES, ...VIBE_NAMES];

  return (
    <div className="landing-ticker" aria-hidden>
      <div className="landing-ticker__track">
        {items.map((name, i) => (
          <span key={i} className="landing-ticker__item">
            {name}
            <span className="landing-ticker__dot" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default VibeNameTicker;
