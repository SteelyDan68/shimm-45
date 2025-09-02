import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { use404Logging } from "@/hooks/useViewLogging";

const NotFound = () => {
  const location = useLocation();
  
  // Auto-log 404 events to server_log_events table
  use404Logging();

  useEffect(() => {
    console.warn(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center p-8">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Sidan du letar efter kunde inte hittas
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Kontrollera URL:en eller navigera tillbaka till startsidan
          </p>
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Tillbaka till startsidan
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;