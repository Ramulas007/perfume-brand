import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const REDIRECT_SECONDS = 8;

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

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
        <h1 className="font-heading text-[8rem] leading-none font-bold bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="font-heading text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page <span className="font-mono text-foreground/80">{location.pathname}</span> doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center mb-6">
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home size={16} /> Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate("/shop")} className="gap-2">
            <Search size={16} /> Browse Shop
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting to home in <span className="font-semibold text-primary">{count}</span>s…
        </p>
      </div>
    </div>
  );
};

export default NotFound;
