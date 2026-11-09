import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string;
}

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (reviewsError || !reviewsData) {
      return;
    }

    const userIds = [...new Set(reviewsData.map(r => r.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, p.full_name])
    );

    const reviewsWithNames = reviewsData.map(r => ({
      ...r,
      user_name: profileMap.get(r.user_id) || 'Anonymous User',
    }));

    setReviews(reviewsWithNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to leave a review.',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: 'Review required',
        description: 'Please write a review before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      product_id: productId,
      rating,
      comment: comment.trim(),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Review submitted',
        description: 'Thank you for your review!',
      });
      setComment('');
      setRating(5);
      fetchReviews();
    }

    setSubmitting(false);
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="pt-8 border-t border-border">
      <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-8 text-center">
        Customer Reviews
      </h2>

      {/* Average rating - Centered */}
      <div className="flex flex-col items-center justify-center gap-2 mb-10">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={28}
              className={
                star <= Math.round(Number(averageRating))
                  ? 'text-warning fill-warning'
                  : 'text-muted-foreground'
              }
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{averageRating}</span>
          <span className="text-muted-foreground">out of 5 ({reviews.length} reviews)</span>
        </div>
      </div>

      {/* Write review form - Centered */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-secondary/50 rounded-xl p-6 md:p-8 mb-10">
          <h3 className="font-semibold text-lg mb-6 text-center">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <label className="block text-sm font-medium mb-3">Your Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoveredStar || rating)
                          ? 'text-warning fill-warning'
                          : 'text-muted-foreground'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="text-center">
              <Button type="submit" className="btn-primary px-8" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>

        {/* Reviews list */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-border rounded-xl p-5 md:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <span className="font-semibold text-foreground">{review.user_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground'
                          }
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
