
interface EmptyShiftsProps {
  message?: string;
}

const EmptyShifts = ({ message = "No shifts found" }: EmptyShiftsProps) => {
  return (
    <div className="text-center p-8 border rounded-lg bg-muted/20">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default EmptyShifts;
