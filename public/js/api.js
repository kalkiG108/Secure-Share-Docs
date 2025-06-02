// API endpoints
const API_BASE_URL = '';  // Routes are at root level as per app.js

// Utility function to handle API calls
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: isFormData ? data : (data ? JSON.stringify(data) : null),
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }

        // For PDF viewing, return the response directly
        if (endpoint.includes('/view/') && response.ok) {
            return response;
        }

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// Authentication API calls
const auth = {
    login: async (username, password, otp) => {
        return apiCall('/auth/login', 'POST', { username, password, otp });
    },
    sendOtp: async (username) => {
        return apiCall('/auth/send-otp', 'POST', { username });
    },
    register: async (formData) => {
        return apiCall('/users/register', 'POST', formData, true);
    }
};

// Document API calls
const documents = {
    getAll: async () => {
        return apiCall('/documents');
    },
    upload: async (formData) => {
        return apiCall('/documents', 'POST', formData, true);
    },
    getDetails: async (documentId) => {
        return apiCall(`/documents/details/${documentId}`);
    },
    view: async (documentId) => {
        return apiCall(`/documents/view/${documentId}`);
    },
    update: async (documentId, formData) => {
        return apiCall(`/documents/${documentId}`, 'PUT', formData, true);
    },
    delete: async (documentId) => {
        return apiCall(`/documents/${documentId}`, 'DELETE');
    },
    share: async (documentId, userData) => {
        return apiCall(`/documents/share/${documentId}`, 'POST', userData);
    }
};

// User API calls
const users = {
    getProfile: async () => {
        return apiCall('/users/profile');
    },
    updateProfile: async (formData) => {
        return apiCall('/users/profile', 'PUT', formData, true);
    },
    deleteAccount: async () => {
        return apiCall('/users/account', 'DELETE');
    }
};

// Export the API utilities
window.api = { auth, documents, users }; 