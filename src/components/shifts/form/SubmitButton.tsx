
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

type SubmitButtonProps = {
  loading: boolean;
  label?: string;
};

export default function SubmitButton({ loading, label = "Create Shift" }: SubmitButtonProps) {
  return (
    <CardFooter>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : label}
      </Button>
    </CardFooter>
  );
}
