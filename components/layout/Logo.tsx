import Image from "next/image";

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Cultural Therapy"
        width={size}
        height={size}
        priority
        className="rounded-sm"
      />
      {withWordmark && (
        <span
          className="font-display text-ink"
          style={{ fontSize: Math.round(size * 0.72) }}
        >
          Cultural Therapy
        </span>
      )}
    </div>
  );
}
