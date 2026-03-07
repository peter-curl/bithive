import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("Page Not Found");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageWrapper>
      <section className="relative flex flex-1 items-center justify-center py-20 honeycomb-bg">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto"
          >
            <Hexagon className="mx-auto h-20 w-20 text-primary" fill="currentColor" strokeWidth={1} />
          </motion.div>

          <div>
            <h1 className="font-heading text-6xl font-bold text-gradient-amber">404</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              This cell of the hive doesn't exist
            </p>
          </div>

          <Button asChild className="glow-amber font-heading">
            <Link to="/">Return to Hive</Link>
          </Button>
        </div>
      </section>
    </PageWrapper>
  );
};

export default NotFound;
