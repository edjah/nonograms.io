import React from "react";

export function ExternalLink(props: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={props.href} className={props.className} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  );
}
