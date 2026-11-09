import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const REDIRECT_SECONDS = 8;

const OrderFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reason = (location.state as { reason?: string } | null)?.reason;
  const [count, setCount] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (count <= 0) {
      navigate("/checkout", { replace: true });
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle size={56} className="text-destructive" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-3">Order Failed</h1>
        <p className="text-lg font-medium mb-2">We couldn't process your order.</p>
        <p className="text-muted-foreground mb-6">
          {reason || "Something went wrong while placing your order. Please try again."}
        </p>
        <div className="flex gap-3 justify-center mb-6">
          <Button onClick={() => navigate("/checkout")} className="gap-2">
            <RefreshCw size={16} /> Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home size={16} /> Home
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting to checkout in <span className="font-semibold text-primary">{count}</span>s…
        </p>
      </div>
    </div>
  );
};

export default OrderFailed;
