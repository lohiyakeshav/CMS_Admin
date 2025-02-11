import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { adminService, authService } from "@/services/apiService";
import { Sun, Moon, Bell, User, FileText, Shield, ChevronRight, Heart } from 'lucide-react';
import LoginPage from "./pages/LoginPage";

interface Policy {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  product_id: number;
  title: string;
  description: string;
  status: "pending" | "approved" | "denied";
}

interface Claim {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  product_id: number;
  title: string;
  claim_amount: number;
  status: "pending" | "approved" | "denied";
}

interface PendingPolicy {
  id: number;
  userId: number | null;
  productId: number;
  purchaseDate: Date;
  validUntil: Date | null;
  cancellationDate: Date | null;
  status: string;
  approvedBy: number | null;
  approvedAt: Date | null;
  paymentStatus: string;
}

interface PendingClaim {
  id: number;
  userId: number | null;
  productId: number;
  claimAmount: number;
  status: string;
  createdAt: Date;
}

const AdminDashboard = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'policies' | 'claims'>('policies');
  const user = authService.getUser();
  const [pendingPolicies, setPendingPolicies] = useState<PendingPolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesData, claimsData] = await Promise.all([
        adminService.getPendingPolicies(),
        adminService.getPendingClaims(),
      ]);
      setPolicies(policiesData);
      setClaims(claimsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up polling for live updates
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPendingPolicies = async () => {
      try {
        const policies = await adminService.getPendingPolicies();
        setPendingPolicies(policies);
      } catch (error) {
        console.error('Error fetching pending policies:', error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPendingPolicies();
  }, []);

  useEffect(() => {
    const fetchPendingClaims = async () => {
      try {
        const claims = await adminService.getPendingClaims();
        setPendingClaims(claims);
      } catch (error) {
        console.error('Error fetching pending claims:', error);
      } finally {
        setLoadingClaims(false);
      }
    };

    fetchPendingClaims();
  }, []);

  const handlePolicyDecision = async (policyId: number, decision: boolean) => {
    try {
      const updatedPolicy = await adminService.approvePolicy(policyId, decision);
      setPendingPolicies(pendingPolicies.filter(policy => policy.id !== policyId));
      toast.success(`Policy ${decision ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to process policy decision");
    }
  };

  const handleClaimDecision = async (claimId: number, decision: boolean) => {
    try {
      let rejectionReason = '';
      if (!decision) {
        rejectionReason = window.prompt('Please enter the reason for rejection:') || '';
        if (!rejectionReason.trim()) {
          toast.error('Rejection reason is required');
          return;
        }
      }

      const result = await adminService.approveClaim(claimId, decision, rejectionReason);
      
      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success(`Claim ${decision ? 'approved' : 'rejected'} successfully`);
      }

      // Update the claims list
      setPendingClaims(prevClaims => 
        prevClaims.filter(claim => claim.id !== claimId)
      );
    } catch (error: any) {
      console.error('Claim decision error:', error);
      toast.error(error.message || 'Failed to process claim decision');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {loading && <LoadingSpinner />}
      
      {/* Top Navigation Bar */}
      <nav className={`fixed w-full z-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
            <Heart className="w-8 h-8 text-blue-600" />
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Claims Management
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome, {user?.name}
              </div>
              <Bell className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} cursor-pointer hover:text-blue-500 transition-colors`} />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80 transition-colors`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button
                onClick={authService.logout}
                className={`${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'policies'
                ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`
            }`}
          >
            Pending Policies
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'claims'
                ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`
            }`}
          >
            Pending Claims
          </button>
        </div>

        {/* Policies Section */}
        {activeTab === 'policies' && (
          <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Pending Policies</h2>
            {loadingPolicies ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingPolicies.length > 0 ? (
                  pendingPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className={`${
                        darkMode ? 'bg-gray-800 text-white' : 'bg-white'
                      } rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] duration-200`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <FileText className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <h3 className="text-xl font-semibold">Policy #{policy.id}</h3>
                          </div>
                          <div className="space-y-2">
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              User ID: {policy.userId ?? 'N/A'}
                            </p>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Product ID: {policy.productId}
                            </p>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Purchase Date: {policy.purchaseDate.toLocaleDateString()}
                            </p>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Valid Until: {policy.validUntil ? policy.validUntil.toLocaleDateString() : 'N/A'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                policy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                policy.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {policy.status}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                policy.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                policy.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {policy.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handlePolicyDecision(policy.id, true)}
                            className={`${
                              darkMode
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-green-500 hover:bg-green-600'
                            } text-white transition-colors`}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handlePolicyDecision(policy.id, false)}
                            className={`${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-red-500 hover:bg-red-600'
                            } text-white transition-colors`}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No pending policies to review</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Claims Section */}
        {activeTab === 'claims' && (
          <div className="grid gap-6">
            {pendingClaims.length > 0 ? (
              pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className={`${
                    darkMode ? 'bg-gray-800 text-white' : 'bg-white'
                  } rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] duration-200`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <FileText className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <h3 className="text-xl font-semibold">Claim #{claim.id}</h3>
                      </div>
                      <div className="space-y-2">
                        {/* <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          User ID: {claim.userId ?? 'N/A'}
                        </p>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Product ID: {claim.productId}
                        </p> */}
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Claim Amount: ₹{claim.claimAmount.toLocaleString()}
                        </p>
                        {/* <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Created At: {claim.createdAt.toLocaleDateString()}
                        </p> */}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          claim.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleClaimDecision(claim.id, true)}
                        className={`${
                          darkMode
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white transition-colors`}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleClaimDecision(claim.id, false)}
                        className={`${
                          darkMode
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white transition-colors`}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No pending claims to review</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <AdminDashboard /> : <LoginPage />;
};

export default App;

