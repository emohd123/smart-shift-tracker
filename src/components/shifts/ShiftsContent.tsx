
import { Shift } from "@/components/shifts/ShiftCard";
import ShiftList from "@/components/shifts/ShiftList";
import { ShiftsLoading } from "@/components/shifts/ShiftsLoading";

interface ShiftsContentProps {
  shifts: Shift[];
  loading: boolean;
  title: string;
  deleteShift: (id: string) => void;
}

export const ShiftsContent = ({ shifts, loading, title, deleteShift }: ShiftsContentProps) => {
  // Assign the deleteShift function to window so other components can use it
  window.deleteShift = deleteShift;
  
  if (loading) {
    return <ShiftsLoading />;
  }
  
  return (
    <ShiftList 
      shifts={shifts} 
      title={title} 
    />
  );
};
