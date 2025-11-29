import { cn } from "@package/ui";

interface StudentBlankInputProps {
  value: string;
  onChange: (value: string) => void;
  hint?: string | null;
}

export function StudentBlankInput({
  value,
  onChange,
  hint,
}: StudentBlankInputProps) {
  const dynamicWidth = Math.max(100, Math.min(300, value.length * 8 + 20));

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "inline-block min-w-[100px] max-w-[300px]",
        "border-0 border-b-2 border-dashed border-gray-400",
        "bg-transparent px-1",
        "focus:border-blue-500 focus:bg-blue-50 focus:outline-none",
        "transition-colors duration-150",
      )}
      style={{ width: `${dynamicWidth}px` }}
      aria-label="Fill in the blank"
    />
  );
}
