/**
 * 📝 COMPREHENSIVE TYPESCRIPT DEFINITIONS V2
 * SCRUM-TEAM SENIOR BACKEND & FRONTEND COLLABORATION
 * 
 * Konsoliderar och förbättrar alla TypeScript types för NCCS
 * Budget: 1 miljard kronor development standard
 */

// ============= CORE SYSTEM TYPES =============

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  is_anonymous: boolean;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  identities?: UserIdentity[];
}

export interface UserIdentity {
  identity_id: string;
  id: string;
  user_id: string;
  identity_data: Record<string, any>;
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
  email?: string;
}

export type AppRole = 'client' | 'coach' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  roles: AppRole[];
  created_at: string;
  updated_at: string;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
}

// ============= PILLAR SYSTEM TYPES =============

export type PillarKey = 'self_care' | 'skills' | 'talent' | 'brand' | 'economy' | 'open_track';

export interface PillarDefinition {
  key: PillarKey;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface AssessmentRound {
  id: string;
  user_id: string;
  created_by: string;
  pillar_type: PillarKey;
  answers: Record<string, any>;
  scores: Record<string, number>;
  comments?: string;
  ai_analysis?: string;
  created_at: string;
  updated_at: string;
}

export interface PillarActivation {
  id: string;
  client_id: string;
  pillar_key: PillarKey;
  is_active: boolean;
  activated_by: string;
  activated_at: string;
  deactivated_at?: string;
}

// ============= TASK & CALENDAR TYPES =============

export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  ai_generated: boolean;
  metadata?: Record<string, any>;
}

export interface CreateTaskData {
  user_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  ai_generated?: boolean;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  category: string;
  created_by: string;
  created_by_role: string;
  visible_to_client: boolean;
  duration?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============= MESSAGING TYPES =============

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'ai_response';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// ============= ANALYTICS TYPES =============

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event: string;
  properties: Record<string, any>;
  session_id: string;
  page_url: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  component: string;
  metric: string;
  value: number;
  timestamp: string;
  context?: Record<string, any>;
}

// ============= AI & COACHING TYPES =============

export interface AIRecommendation {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  status: 'pending' | 'accepted' | 'completed' | 'superseded';
  difficulty: number;
  estimated_duration?: number;
  completion_rate?: number;
  user_rating?: number;
  dependencies?: string[];
  resources?: string[];
  created_at: string;
  updated_at: string;
}

export interface CoachingSession {
  id: string;
  user_id: string;
  coach_id: string;
  session_type: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  effectiveness_score?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============= FORM & UI TYPES =============

export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  value: T;
  placeholder?: string;
  required?: boolean;
  validation?: (value: T) => string | null;
  options?: Array<{ label: string; value: any }>;
  disabled?: boolean;
  helpText?: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  data?: any;
  config?: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  completedAssessments: number;
  pendingTasks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

// ============= API RESPONSE TYPES =============

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
  };
}

// ============= ERROR HANDLING TYPES =============

export interface ErrorContext {
  component?: string;
  operation?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface SystemError {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// ============= NAVIGATION & ROUTING TYPES =============

export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
  roles?: AppRole[];
  exact?: boolean;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

// ============= PERMISSION & SECURITY TYPES =============

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  condition?: (user: User, target?: any) => boolean;
}

export interface SecurityContext {
  user: User;
  roles: AppRole[];
  permissions: Permission[];
  isAuthenticated: boolean;
  sessionExpiry?: string;
}

// ============= UTILITY TYPES =============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Timestamp = string; // ISO 8601 format

export type UUID = string;

// ============= HOOK RETURN TYPES =============

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export interface UseFormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  handleSubmit: (handler: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => void;
  reset: () => void;
}

// ============= COMPONENT PROP TYPES =============

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean;
  loadingText?: string;
  spinner?: boolean;
}

export interface ErrorProps extends BaseComponentProps {
  error?: string | Error | null;
  onRetry?: () => void;
  retryText?: string;
}

// ============= THEME & STYLING TYPES =============

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  borderRadius: number;
  fontSize: number;
  animations: boolean;
}

// ============= EXPORT GROUPS =============

// Export all types individually to avoid conflicts
export type NccsUser = User;
export type NccsUserIdentity = UserIdentity; 
export type NccsUserProfile = UserProfile;
export type NccsAppRole = AppRole;
export type NccsSecurityContext = SecurityContext;
export type NccsPermission = Permission;

export type NccsPillarKey = PillarKey;
export type NccsPillarDefinition = PillarDefinition;
export type NccsAssessmentRound = AssessmentRound;
export type NccsPillarActivation = PillarActivation;

export type NccsTask = Task;
export type NccsCreateTaskData = CreateTaskData;
export type NccsTaskStatus = TaskStatus;
export type NccsTaskPriority = TaskPriority;
export type NccsCalendarEvent = CalendarEvent;

export type NccsMessage = Message;
export type NccsMessageAttachment = MessageAttachment;
export type NccsConversation = Conversation;

export type NccsAnalyticsEvent = AnalyticsEvent;
export type NccsPerformanceMetric = PerformanceMetric;

export type NccsAIRecommendation = AIRecommendation;
export type NccsCoachingSession = CoachingSession;

export type NccsFormField<T = any> = FormField<T>;
export type NccsDashboardWidget = DashboardWidget;
export type NccsDashboardStats = DashboardStats;
export type NccsNavigationItem = NavigationItem;
export type NccsBreadcrumbItem = BreadcrumbItem;

export type NccsApiResponse<T = any> = ApiResponse<T>;
export type NccsPaginatedResponse<T> = PaginatedResponse<T>;

export type NccsErrorContext = ErrorContext;
export type NccsSystemError = SystemError;

export type NccsDeepPartial<T> = DeepPartial<T>;
export type NccsOptional<T, K extends keyof T> = Optional<T, K>;
export type NccsRequiredFields<T, K extends keyof T> = RequiredFields<T, K>;
export type NccsTimestamp = Timestamp;
export type NccsUUID = UUID;

export type NccsUseAsyncState<T> = UseAsyncState<T>;
export type NccsUseFormState<T> = UseFormState<T>;

export type NccsBaseComponentProps = BaseComponentProps;
export type NccsLoadingProps = LoadingProps;
export type NccsErrorProps = ErrorProps;

export type NccsThemeMode = ThemeMode;
export type NccsThemeConfig = ThemeConfig;

export default {
  // Type guards and validators will be added here
};