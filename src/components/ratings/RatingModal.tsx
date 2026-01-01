import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type RatingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  shiftAssignmentId: string;
  promoterId: string;
  promoterName: string;
  onSuccess?: () => void;
};

export const RatingModal = ({
  open,
  onOpenChange,
  shiftId,
  shiftAssignmentId,
  promoterId,
  promoterName,
  onSuccess,
}: RatingModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (comment.length > 500) {
      toast.error("Comment must be 500 characters or less");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("shift_ratings").insert({
        shift_id: shiftId,
        shift_assignment_id: shiftAssignmentId,
        company_id: user?.id,
        promoter_id: promoterId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already rated this promoter for this shift");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Rating submitted successfully");
      onOpenChange(false);
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  const getRatingLabel = (value: number): string => {
    switch (value) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Promoter</DialogTitle>
          <DialogDescription>
            Rate {promoterName}'s performance for this shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      value <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-transparent text-gray-300 hover:text-yellow-200"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn(
              "text-sm",
              displayRating > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {getRatingLabel(displayRating)}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about the promoter's performance..."
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
