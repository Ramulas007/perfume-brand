import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const REDIRECT_SECONDS = 6;

const Forbidden = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (count <= 0) {
      navigate("/auth", { replace: true });
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert size={40} className="text-destructive" />
        </div>
        <h1 className="font-heading text-[6rem] leading-none font-bold bg-gradient-to-br from-destructive to-destructive/50 bg-clip-text text-transparent">
          403
        </h1>
        <h2 className="font-heading text-2xl font-semibold mb-3">Access Forbidden</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please sign in with an authorized account.
        </p>
        <div className="flex gap-3 justify-center mb-6">
          <Button onClick={() => navigate("/auth")} className="gap-2">
            <LogIn size={16} /> Sign In
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home size={16} /> Home
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting to login in <span className="font-semibold text-primary">{count}</span>s…
        </p>
      </div>
    </div>
  );
};

export default Forbidden;
