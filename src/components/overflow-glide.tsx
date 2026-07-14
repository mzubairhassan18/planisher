"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type GlideStyle = CSSProperties & {
  "--glide-distance"?: string;
  "--glide-duration"?: string;
};

export function OverflowGlide({
  className = "",
  text,
}: {
  className?: string;
  text: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const measure = () => {
      setDistance(Math.max(0, track.scrollWidth - container.clientWidth));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(track);
    return () => observer.disconnect();
  }, [text]);

  const style: GlideStyle = distance
    ? {
        "--glide-distance": `-${distance}px`,
        "--glide-duration": `${Math.min(7, Math.max(2.4, distance / 30))}s`,
      }
    : {};

  return (
    <span
      className={`overflow-glide ${distance ? "can-glide" : ""} ${className}`.trim()}
      ref={containerRef}
      style={style}
      title={distance ? text : undefined}
    >
      <span className="overflow-glide-track" ref={trackRef}>
        {text}
      </span>
    </span>
  );
}
