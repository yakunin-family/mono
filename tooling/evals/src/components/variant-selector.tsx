import { Select, SelectContent, SelectItem, SelectTrigger } from "@package/ui";

export function VariantSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "latest")}>
      <SelectTrigger className="w-48">Variant: {value}</SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">latest</SelectItem>
      </SelectContent>
    </Select>
  );
}
