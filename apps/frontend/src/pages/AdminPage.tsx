import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface ApprovalRequest {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export function AdminPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/approvals');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch approval requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    await processRequest(requestId, 'approved');
  };

  const handleReject = async (requestId: string) => {
    await processRequest(requestId, 'rejected');
  };

  const processRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      await api.put(`/admin/approvals/${requestId}`, {
        status,
        adminNotes: adminNotes || undefined,
      });

      toast({
        title: 'Success',
        description: `Request ${status} successfully`,
      });

      setSelectedRequest(null);
      setAdminNotes('');
      await fetchRequests();
    } catch (error) {
      console.error(`Error ${status}ing request:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${status} request`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-gray-600">Manage user approval requests</p>
      </div>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                No approval requests found
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{request.name}</CardTitle>
                    <CardDescription>{request.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      {request.status === 'pending' ? 'Review' : 'View Details'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <p>Requested: {formatDate(request.requested_at)}</p>
                  {request.reviewed_at && (
                    <p>Reviewed: {formatDate(request.reviewed_at)}</p>
                  )}
                  {request.admin_notes && (
                    <p className="mt-2">
                      <strong>Admin Notes:</strong> {request.admin_notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Review Request</CardTitle>
              <CardDescription>
                {selectedRequest.name} ({selectedRequest.email})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the user..."
                  rows={3}
                />
              </div>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}
              
              <Button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
