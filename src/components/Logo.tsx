import "./Logo.css";

export function Logo() {
  return (
    <svg
      className="logo-animated"
      viewBox="0 0 400 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Цветные блоки - фон */}
      <rect
        className="logo-block block-1"
        x="5"
        y="10"
        width="85"
        height="80"
        rx="4"
        fill="#E76F51"
        transform="skewX(-8)"
      />
      <rect
        className="logo-block block-2"
        x="95"
        y="10"
        width="85"
        height="80"
        rx="4"
        fill="#F4A261"
        transform="skewX(-8)"
      />
      <rect
        className="logo-block block-3"
        x="185"
        y="10"
        width="85"
        height="80"
        rx="4"
        fill="#E9C46A"
        transform="skewX(-8)"
      />
      <rect
        className="logo-block block-4"
        x="275"
        y="10"
        width="110"
        height="80"
        rx="4"
        fill="#2A9D8F"
        transform="skewX(-8)"
      />

      {/* Текст DAMAGOTCHI */}
      <text
        className="logo-text"
        x="200"
        y="68"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontSize="42"
        fontWeight="bold"
        fill="#F4F4F4"
        style={{ letterSpacing: '2px' }}
      >
        DAMAGOTCHI
      </text>
    </svg>
  );
}
