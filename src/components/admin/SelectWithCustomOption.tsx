import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface SelectWithCustomOptionProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

const SelectWithCustomOption: React.FC<SelectWithCustomOptionProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__ADD_NEW__") {
      setIsAddingNew(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onChange(customValue.trim().toUpperCase());
      setCustomValue("");
      setIsAddingNew(false);
    }
  };

  const handleCancelCustom = () => {
    setCustomValue("");
    setIsAddingNew(false);
  };

  if (isAddingNew) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder={`Enter new ${label.toLowerCase()}`}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
            if (e.key === "Escape") {
              handleCancelCustom();
            }
          }}
          autoFocus
        />
        <Button type="button" size="icon" variant="outline" onClick={handleAddCustom}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={handleCancelCustom}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Check if current value is custom (not in options)
  const isCustomValue = value && !options.includes(value);

  return (
    <Select onValueChange={handleSelectChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__ADD_NEW__" className="text-primary font-medium">
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new {label.toLowerCase()}
          </span>
        </SelectItem>
        {isCustomValue && (
          <SelectItem key={value} value={value} className="border-b">
            {value} (Custom)
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectWithCustomOption;
