export function Logo(props: { className?: string }) {
  const pad = 15;

  return (
    <svg
      className={props.className}
      viewBox="-5 -5 110 110"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000"
      fill="#fafafa"
      strokeLinecap="round"
      strokeWidth="5"
    >
      {/* Outer rect */}
      <rect x="0" y="0" width="100" height="100" rx="10" />

      {/* Cross 1 */}
      <line x1={pad} y1={pad} x2={50 - pad} y2={50 - pad} />
      <line x1={pad} y1={50 - pad} x2={50 - pad} y2={pad} />

      {/* Cross 2 */}
      <line x1={50 + pad} y1={50 + pad} x2={100 - pad} y2={100 - pad} />
      <line x1={50 + pad} y1={100 - pad} x2={100 - pad} y2={50 + pad} />

      {/* Filled rect 1 */}
      <path
        d="
            M 50 50
            L 50 0
            L 90 0
            A 10 10 0 0 1 100 10
            L 100 50
            z
        "
        fill="#334455"
      />

      {/* Filled rect 2 */}
      <path
        d="
            M 50 50
            L 50 100
            L 10 100
            A 10 10 0 0 1 0 90
            L 0 50
            z
        "
        fill="#334455"
      />
    </svg>
  );
}
