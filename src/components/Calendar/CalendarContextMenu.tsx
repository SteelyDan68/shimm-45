import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  CheckSquare, 
  Copy, 
  Share2, 
  Eye, 
  Shield,
  Brain,
  Clock,
  Flag,
  MoreHorizontal 
} from 'lucide-react';
import { CalendarEventData } from '@/hooks/useCalendarData';
import { Task } from '@/types/tasks';

interface CalendarContextMenuProps {
  children: React.ReactNode;
  item: CalendarEventData | (Task & { type: 'task' });
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleVisibility?: () => void;
  onChangePriority?: (priority: 'low' | 'medium' | 'high') => void;
  onConvertType?: (newType: 'task' | 'event') => void;
  onShare?: () => void;
  canManage?: boolean;
  isCoachView?: boolean;
}

export const CalendarContextMenu = ({
  children,
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onChangePriority,
  onConvertType,
  onShare,
  canManage = false,
  isCoachView = false
}: CalendarContextMenuProps) => {
  const isTask = 'status' in item;
  const isCompleted = isTask && item.status === 'completed';
  const isVisible = 'visible_to_client' in item && item.visible_to_client;
  const isAIGenerated = 'ai_generated' in item ? item.ai_generated : false;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* View/Edit Actions */}
        <ContextMenuItem onClick={onEdit} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Visa detaljer
        </ContextMenuItem>
        
        {canManage && (
          <ContextMenuItem onClick={onEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Redigera
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Task-specific actions */}
        {isTask && !isCompleted && canManage && (
          <ContextMenuItem className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Markera som klar
          </ContextMenuItem>
        )}

        {/* Conversion options */}
        {canManage && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Konvertera till
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {!isTask && (
                <ContextMenuItem onClick={() => onConvertType?.('task')} className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Uppgift
                </ContextMenuItem>
              )}
              {isTask && (
                <ContextMenuItem onClick={() => onConvertType?.('event')} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Kalenderhändelse
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Priority management */}
        {canManage && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Ändra prioritet
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem 
                onClick={() => onChangePriority?.('high')} 
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                Hög
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={() => onChangePriority?.('medium')} 
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                Medium
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={() => onChangePriority?.('low')} 
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                Låg
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator />

        {/* Utility actions */}
        <ContextMenuItem onClick={onDuplicate} className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Duplicera
        </ContextMenuItem>

        <ContextMenuItem onClick={onShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Dela
        </ContextMenuItem>

        {/* Visibility toggle for coaches */}
        {isCoachView && canManage && (
          <ContextMenuItem onClick={onToggleVisibility} className="flex items-center gap-2">
            {isVisible ? (
              <>
                <Shield className="h-4 w-4" />
                Göm från klient
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Visa för klient
              </>
            )}
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Metadata indicators */}
        <div className="px-2 py-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3" />
            {isTask ? 'Uppgift' : 'Händelse'}
            {isAIGenerated && (
              <>
                <Brain className="h-3 w-3" />
                AI-skapad
              </>
            )}
          </div>
          {isTask && (
            <div className="flex items-center gap-2">
              Status: {item.status === 'completed' ? 'Klar' : 'Pågående'}
            </div>
          )}
        </div>

        <ContextMenuSeparator />

        {/* Delete action */}
        {canManage && (
          <ContextMenuItem 
            onClick={onDelete} 
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Radera
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};