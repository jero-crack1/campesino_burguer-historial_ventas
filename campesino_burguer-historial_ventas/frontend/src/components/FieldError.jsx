export default function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-[var(--danger-text)] mt-1">{message}</p>;
}
