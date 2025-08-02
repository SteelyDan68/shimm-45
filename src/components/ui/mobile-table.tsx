import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MobileTableRowData {
  id: string;
  title: string;
  subtitle?: string;
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  actions?: React.ReactNode;
  fields?: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
}

interface ResponsiveTableProps {
  data: MobileTableRowData[];
  columns: Array<{
    key: string;
    label: string;
    className?: string;
  }>;
  onRowClick?: (item: MobileTableRowData) => void;
  className?: string;
}

// Enhanced mobile-responsive table wrapper
export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  onRowClick,
  className
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <Card 
            key={item.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
              onRowClick && "hover:bg-muted/50"
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.actions && (
                  <div className="ml-2 flex-shrink-0">
                    {item.actions}
                  </div>
                )}
              </div>
              
              {item.badges && item.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.badges.map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant={badge.variant} 
                      className="text-xs"
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
              
              {item.fields && item.fields.length > 0 && (
                <div className="space-y-2">
                  {item.fields.map((field, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {field.label}:
                      </span>
                      <div className="text-xs font-medium">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        <thead className="[&_tr]:border-b">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((item) => (
            <tr
              key={item.id}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <td className="p-4 align-middle">
                <div>
                  <div className="font-medium">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </td>
              {item.badges && (
                <td className="p-4 align-middle">
                  <div className="flex flex-wrap gap-1">
                    {item.badges.map((badge, index) => (
                      <Badge key={index} variant={badge.variant}>
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                </td>
              )}
              {item.fields?.map((field, index) => (
                <td key={index} className="p-4 align-middle">
                  {field.value}
                </td>
              ))}
              {item.actions && (
                <td className="p-4 align-middle">
                  {item.actions}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};