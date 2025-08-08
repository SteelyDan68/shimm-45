import { ChevronRight, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";

export function AutoBreadcrumbs() {
  const { getBreadcrumbs } = useNavigation();
  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={`${breadcrumb.path}-${index}`} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          
          {breadcrumb.isLast ? (
            <span className="text-foreground font-medium truncate">
              {breadcrumb.title}
            </span>
          ) : (
            <NavLink
              to={breadcrumb.path}
              className="hover:text-foreground transition-colors truncate"
              aria-label={`Gå till ${breadcrumb.title}`}
            >
              {index === 0 && breadcrumb.icon && (
                <breadcrumb.icon className="h-4 w-4 inline mr-1" />
              )}
              {breadcrumb.title}
            </NavLink>
          )}
        </div>
      ))}
    </nav>
  );
}