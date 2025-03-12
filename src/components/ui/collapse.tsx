
import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapseProps {
  open?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Collapse = ({ open = false, children, className }: CollapseProps) => {
  const [height, setHeight] = React.useState<number | undefined>(
    open ? undefined : 0
  );
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!height || !open || !ref.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      setHeight(ref.current?.offsetHeight);
    });
    
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, [height, open]);

  React.useEffect(() => {
    if (open) {
      setHeight(ref.current?.offsetHeight);
    } else {
      setHeight(0);
    }
  }, [open]);

  return (
    <div
      className={cn("overflow-hidden transition-all duration-300", className)}
      style={{ height }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};
