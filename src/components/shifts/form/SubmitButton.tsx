
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

type SubmitButtonProps = {
  loading: boolean;
};

export default function SubmitButton({ loading }: SubmitButtonProps) {
  return (
    <CardFooter>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Shift"}
      </Button>
    </CardFooter>
  );
}
