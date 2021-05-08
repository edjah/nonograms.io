/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

export function Logo(props: { className?: string; animationPeriodSeconds?: number }) {
  const period = props.animationPeriodSeconds;
  const animationStyle =
    period &&
    css`
      @media (prefers-reduced-motion: no-preference) {
        animation: App-logo-spin-${period} infinite ${period}s linear;
      }

      @keyframes App-logo-spin-${period} {
        0% {
          transform: rotate(0deg);
        }
        ${25 - 30 / period}% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(90deg);
        }
        ${50 - 30 / period}% {
          transform: rotate(90deg);
        }
        50% {
          transform: rotate(180deg);
        }
        ${75 - 30 / period}% {
          transform: rotate(180deg);
        }
        75% {
          transform: rotate(270deg);
        }
        ${100 - 30 / period}% {
          transform: rotate(270deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;

  const pad = 15;

  return (
    <svg
      className={props.className}
      css={animationStyle}
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
