// Base URL for the API
const BASE_URL = 'http://localhost:3000/api';

// Helper function to handle API requests
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Ensure response contains user role
    if (!response.user || !response.user.role) {
      throw new Error('Invalid user data received');
    }
    
    // Store the token and user data
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const adminService = {
  getPendingPolicies: async (): Promise<PendingPolicy[]> => {
    const response = await fetchApi('/admin/pendingPolicies');
    return response.map((policy: any) => ({
      id: policy.id,
      userId: policy.user_id,
      productId: policy.product_id,
      purchaseDate: new Date(policy.purchase_date),
      validUntil: policy.valid_until ? new Date(policy.valid_until) : null,
      cancellationDate: policy.cancellation_date ? new Date(policy.cancellation_date) : null,
      status: policy.status,
      approvedBy: policy.approved_by,
      approvedAt: policy.approved_at ? new Date(policy.approved_at) : null,
      paymentStatus: policy.payment_status,
    }));
  },

  getPendingClaims: async (): Promise<PendingClaim[]> => {
    const response = await fetchApi('/admin/pendingClaims');
    return response.map((claim: any) => ({
      id: claim.id,
      userId: claim.user_id,
      productId: claim.product_id,
      claimAmount: claim.claim_amount,
      status: claim.status,
      createdAt: new Date(claim.created_at),
    }));
  },

  approvePolicy: async (policyId: number, decision: boolean) => {
    return fetchApi(`/admin/approvePolicy/${policyId}`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  },

  approveClaim: async (claimId: number, decision: boolean, rejectionReason: string = '') => {
    try {
      const response = await fetchApi(`/admin/approveClaim/${claimId}`, {
        method: "POST",
        body: JSON.stringify({ 
          decision,
          rejection_reason: !decision ? rejectionReason : null
        }),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process claim decision');
    }
  },
};