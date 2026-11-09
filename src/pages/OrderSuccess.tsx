import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const REDIRECT_SECONDS = 8;

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;
  const [count, setCount] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (count <= 0) {
      navigate("/", { replace: true });
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={56} className="text-green-600" />
          </div>
        </div>
        <h1 className="font-heading text-3xl font-bold mb-3">🎉 Congratulations!</h1>
        <p className="text-lg font-medium mb-2">Your order has been placed successfully.</p>
        <p className="text-muted-foreground mb-4">
          Thank you for shopping with Helpful Perfumes. We'll contact you shortly to confirm delivery.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Order ID:{" "}
            <span className="font-mono font-semibold text-foreground">
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}
        <div className="flex gap-3 justify-center mb-6">
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home size={16} /> Home
          </Button>
          <Button variant="outline" onClick={() => navigate("/order-tracking")} className="gap-2">
            <Package size={16} /> Track Order
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting to home in <span className="font-semibold text-primary">{count}</span>s…
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
