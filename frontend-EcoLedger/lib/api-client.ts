// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health Check
  async healthCheck() {
    return this.request<HealthResponse>('/api/health');
  }

  // Activities
  async getActivities(params?: {
    user_id?: string;
    page?: number;
    page_size?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.request<ActivityListResponse>(
      `/api/activities${query ? `?${query}` : ''}`
    );
  }

  async getActivity(id: string) {
    return this.request<ActivityResponse>(`/api/activities/${id}`);
  }

  async createActivity(data: ActivityCreate) {
    return this.request<ActivityResponse>('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Emission Estimation
  async estimateEmission(data: EmissionEstimateRequest) {
    return this.request<EmissionEstimateResponse>('/api/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Activity Types
  async getActivityTypes() {
    return this.request<ActivityTypesResponse>('/api/activity-types');
  }

  // Verify Chain
  async verifyChain() {
    return this.request<HashVerificationResponse>('/api/verify-chain');
  }

  // Search Emission Factors
  async searchEmissionFactors(params?: {
    query?: string;
    category?: string;
    region?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<any>(`/api/emission-factors/search${query ? `?${query}` : ''}`);
  }
}

// Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  climatiq_api: string;
}

export interface ActivityCreate {
  user_id: string;
  activity_type: string;
  distance_km?: number;
  energy_kwh?: number;
  weight_kg?: number;
  money_spent?: number;
  description?: string;
}

export interface ActivityResponse {
  id: string;
  user_id: string;
  activity_type: string;
  emission: number;
  emission_unit: string;
  timestamp: string;
  previous_hash: string;
  current_hash: string;
  description?: string;
  climatiq_data?: any;
  distance_km?: number;
  energy_kwh?: number;
  weight_kg?: number;
  money_spent?: number;
}

export interface ActivityListResponse {
  total: number;
  page: number;
  page_size: number;
  activities: ActivityResponse[];
}

export interface EmissionEstimateRequest {
  activity_type: string;
  distance_km?: number;
  energy_kwh?: number;
  weight_kg?: number;
  money_spent?: number;
}

export interface EmissionEstimateResponse {
  activity_type: string;
  emission: number;
  emission_unit: string;
  climatiq_activity_id: string;
  parameters: Record<string, any>;
}

export interface HashVerificationResponse {
  valid: boolean;
  total_records: number;
  message: string;
  invalid_record_id?: string;
}

export interface ActivityTypesResponse {
  total: number;
  categories: {
    [key: string]: {
      count: number;
      activities: string[];
    };
  };
  all_activities: string[];
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
