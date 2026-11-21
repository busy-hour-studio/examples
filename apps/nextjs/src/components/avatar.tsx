import { colorFor, initials } from "@/lib/format";

/** Initials on a colour derived from the user id. */
export function Avatar({
  id,
  name,
  size = 36,
}: {
  id: string;
  name: string;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: colorFor(id),
      }}
    >
      {initials(name)}
    </span>
  );
}
