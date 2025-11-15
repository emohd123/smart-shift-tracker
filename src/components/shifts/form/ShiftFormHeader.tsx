
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ShiftFormHeaderProps = {
  title?: string;
};

export default function ShiftFormHeader({ title = "Create New Shift" }: ShiftFormHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>
        {title.includes("Edit") 
          ? "Update shift information below" 
          : "Fill in the details to create a new shift"}
      </CardDescription>
    </CardHeader>
  );
}
