// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Client
class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set auth token for subsequent requests
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    };

    // ✅ PERBAIKAN: Auto-load token dari localStorage jika belum ada
    let token = this.authToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('access_token');
      if (token) {
        this.authToken = token; // Cache untuk request berikutnya
      }
    }

    // Add auth token if available
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Making request to:', endpoint, 'with auth:', !!token); // Debug

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      
      // ✅ TAMBAHAN: Auto redirect ke login jika unauthorized
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  async register(data: UserRegister) {
    return this.request<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: UserLogin) {
    return this.request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<UserResponse>('/api/auth/me', { headers });
  }

  // =========================================================================
  // ORGANISASI
  // =========================================================================

  async getOrganisasiList() {
    return this.request<OrganisasiResponse[]>('/api/organisasi');
  }

  // =========================================================================
  // HEALTH & SYSTEM
  // =========================================================================

  async healthCheck() {
    return this.request<HealthResponse>('/api/health');
  }

  async verifyChain() {
    return this.request<HashVerificationResponse>('/api/verify-chain');
  }

  // =========================================================================
  // ACTIVITIES
  // =========================================================================

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

  // =========================================================================
  // EMISSION
  // =========================================================================

  async estimateEmission(data: EmissionEstimateRequest) {
    return this.request<EmissionEstimateResponse>('/api/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActivityTypes() {
    return this.request<ActivityTypesResponse>('/api/activity-types');
  }

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

  // =========================================================================
  // AI ASSISTANT
  // =========================================================================

  async getAiTips() {
    return this.request<{ user: string; tips: string }>('/api/ai/tips', {
      method: 'POST',
    });
  }

  // =========================================================================
  // DASHBOARD STATS & AUDIT LOGS 
  // =========================================================================

  // Mengambil data untuk Grafik Chart.js
  async getDashboardStats() {
    // Kita pakai 'any' dulu untuk tipe returnnya biar tidak ribet bikin interface baru
    return this.request<any>('/api/dashboard/stats');
  }

  // Mengambil data Audit Log
  async getAuditLogs() {
    return this.request<any>('/api/dashboard/logs');
  }
    // Tambahkan method verifyHashChain dengan parameter user_id
  async verifyHashChain(params?: { user_id?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    
    const query = queryParams.toString();
    return this.request<HashVerificationResponse>(
      `/api/verify-chain${query ? `?${query}` : ''}`
    );
  }
  
}

// =============================================================================
// TYPES - Authentication
// =============================================================================

export interface OrganisasiResponse {
  id: string;
  nama: string;
  created_at: string;
  jumlah_anggota: number;
}

export interface UserRegister {
  email: string;
  password: string;
  name: string;
  organisasi?: string;
  role?: 'admin' | 'user';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  organisasi?: OrganisasiResponse;
  role: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// =============================================================================
// TYPES - System
// =============================================================================

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  climatiq_api: string;
}

export interface HashVerificationResponse {
  valid: boolean;
  total_records: number;
  message: string;
  invalid_record_id?: string;
}

// =============================================================================
// TYPES - Activity
// =============================================================================

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
  is_valid?: boolean;
  hash_status?: string;
}

export interface ActivityListResponse {
  total: number;
  page: number;
  page_size: number;
  activities: ActivityResponse[];
}

// =============================================================================
// TYPES - Emission
// =============================================================================

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

// Auto-restore token from localStorage if in browser
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    apiClient.setAuthToken(token);
  }
}
