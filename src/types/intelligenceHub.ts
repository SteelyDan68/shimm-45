export interface IntelligenceDataSource {
  id: string;
  name: string;
  type: 'social_media' | 'news' | 'analytics' | 'behavioral' | 'custom';
  provider: string;
  isActive: boolean;
  refreshInterval: number; // minutes
  lastUpdated?: Date;
  metadata?: Record<string, any>;
}

export interface IntelligenceMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  category: string;
  timestamp: Date;
  source: string;
  confidence?: number; // 0-1
}

export interface IntelligenceInsight {
  id: string;
  title: string;
  description: string;
  category: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
  actionItems?: string[];
}

export interface IntelligenceProfile {
  userId: string;
  displayName: string;
  email: string;
  category?: string;
  
  // Core metrics
  metrics: IntelligenceMetric[];
  insights: IntelligenceInsight[];
  
  // Data sources
  connectedSources: IntelligenceDataSource[];
  
  // Social media presence
  socialProfiles: {
    platform: string;
    handle?: string;
    followers?: number;
    following?: number;
    posts?: number;
    engagement?: number;
    verified?: boolean;
    url?: string;
  }[];
  
  // News & mentions
  newsMentions: {
    id: string;
    title: string;
    summary?: string;
    url?: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
    relevanceScore: number;
  }[];
  
  // Behavioral analytics
  behaviorAnalytics: {
    communicationStyle: string;
    responsePatterns: Record<string, any>;
    engagementTrends: Record<string, any>;
    preferredChannels: string[];
    activityPeaks: Record<string, any>;
  };
  
  // Progress tracking (Six Pillars integration)
  pillarProgress: {
    pillarKey: string;
    pillarName: string;
    currentScore: number;
    targetScore: number;
    progress: number; // 0-1
    lastAssessment: Date;
    trends: {
      period: string;
      change: number;
    }[];
  }[];
  
  // Coaching journey
  coachingJourney: {
    totalSessions: number;
    averageRating: number;
    completedRecommendations: number;
    activeGoals: number;
    milestones: {
      id: string;
      title: string;
      completedAt?: Date;
      status: 'pending' | 'completed' | 'overdue';
    }[];
  };
  
  // Metadata
  lastUpdated: Date;
  dataQuality: number; // 0-1
  privacySettings: {
    shareAnalytics: boolean;
    shareProgress: boolean;
    shareSocialData: boolean;
  };
}

// Provider interfaces for extensibility
export interface IntelligenceProvider {
  id: string;
  name: string;
  type: IntelligenceDataSource['type'];
  
  // Core methods
  fetchData(userId: string, config?: any): Promise<any>;
  parseData(rawData: any): IntelligenceMetric[];
  generateInsights(metrics: IntelligenceMetric[]): IntelligenceInsight[];
  
  // Configuration
  getConfigSchema(): Record<string, any>;
  validateConfig(config: any): boolean;
  
  // Lifecycle
  initialize(config: any): Promise<void>;
  cleanup(): Promise<void>;
}

// Event system for real-time updates
export interface IntelligenceEvent {
  id: string;
  type: 'metric_updated' | 'insight_generated' | 'data_source_connected' | 'anomaly_detected';
  userId: string;
  timestamp: Date;
  payload: any;
  source: string;
}

export interface IntelligenceEventHandler {
  handleEvent(event: IntelligenceEvent): Promise<void>;
}

// Search and filtering
export interface IntelligenceFilter {
  userId?: string;
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sources?: string[];
  confidence?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface IntelligenceSearchResult {
  profiles: IntelligenceProfile[];
  metrics: IntelligenceMetric[];
  insights: IntelligenceInsight[];
  totalCount: number;
  hasMore: boolean;
}

// Export and analysis interfaces
export interface IntelligenceReport {
  id: string;
  title: string;
  description: string;
  type: 'summary' | 'detailed' | 'comparison' | 'trend';
  userIds: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: {
    id: string;
    title: string;
    type: 'chart' | 'table' | 'text' | 'insights';
    data: any;
  }[];
  generatedAt: Date;
  generatedBy: string;
}

// Plugin system for extensibility
export interface IntelligencePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Plugin lifecycle
  install(): Promise<void>;
  uninstall(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  
  // Feature extensions
  getProviders?(): IntelligenceProvider[];
  getEventHandlers?(): IntelligenceEventHandler[];
  getReportTypes?(): string[];
  getWidgetComponents?(): React.ComponentType<any>[];
}

// API response interfaces for external consumption
export interface IntelligenceAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    version: string;
    source: string;
  };
}

// Configuration for the Intelligence Hub instance
export interface IntelligenceHubConfig {
  // Core settings
  enableRealtime: boolean;
  defaultRefreshInterval: number;
  maxDataRetentionDays: number;
  
  // Privacy & Security
  defaultPrivacySettings: IntelligenceProfile['privacySettings'];
  requireDataConsent: boolean;
  enableDataEncryption: boolean;
  
  // Features
  enabledProviders: string[];
  enabledPlugins: string[];
  customTheme?: Record<string, any>;
  
  // API settings
  apiVersion: string;
  rateLimits: {
    requests: number;
    window: number; // seconds
  };
  
  // Integration settings
  webhookEndpoints?: {
    onInsightGenerated?: string;
    onAnomalyDetected?: string;
    onDataUpdated?: string;
  };
}