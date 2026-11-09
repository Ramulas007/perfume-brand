import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/metaPixel";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // The pixel snippet already fires the initial PageView; only track route changes.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
};

export default ScrollToTop;
