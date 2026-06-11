"use client";

import { useState } from "react";

export function BookCover({
  src,
  alt,
  className,
  children,
}: {
  src: string | null;
  alt: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{children}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
