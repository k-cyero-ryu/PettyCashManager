import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useState } from "react";

export default function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [comments, setComments] = useState("");

  const { data: pendingTransactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", { status: "pending" }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments?: string }) => {
      await apiRequest("PATCH", `/api/transactions/${id}/status`, { status, comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction status updated successfully",
      });
      setSelectedTransaction(null);
      setComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (transaction: any) => {
    updateStatusMutation.mutate({
      id: transaction.id,
      status: "approved",
      comments: comments || undefined,
    });
  };

  const handleReject = (transaction: any) => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide a reason for rejecting this transaction",
        variant: "destructive",
      });
      return;
    }
    
    updateStatusMutation.mutate({
      id: transaction.id,
      status: "rejected",
      comments,
    });
  };

  // Check if user has approval permissions
  if (user?.role === "custodian") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                You don't have permission to access the approvals page. 
                Only accountants and administrators can approve transactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Approvals</h2>
              <p className="text-gray-500 text-sm mt-1">Review and approve pending transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <p className="text-orange-600 font-semibold text-lg">
                  {pendingTransactions?.length || 0}
                </p>
                <p className="text-orange-600 text-xs">Pending</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg h-32" />
              ))}
            </div>
          ) : pendingTransactions?.length > 0 ? (
            <div className="grid gap-4">
              {pendingTransactions.map((transaction: any) => (
                <Card key={transaction.id} className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{transaction.description}</h3>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-lg text-red-600">
                              -${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Received By</p>
                            <p className="font-medium">{transaction.receivedBy}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Payment Method</p>
                            <p className="font-medium capitalize">{transaction.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Submitted By</p>
                            <p className="font-medium">{transaction.submitterName || transaction.submitterEmail}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-500 text-sm">Date</p>
                          <p className="font-medium">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Review Transaction</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">{transaction.description}</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500">Amount</p>
                                    <p className="font-medium">-${Math.abs(parseFloat(transaction.amount)).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Date</p>
                                    <p className="font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {transaction.receiptUrl && (
                                <div>
                                  <p className="text-gray-500 text-sm mb-2">Receipt</p>
                                  <a 
                                    href={transaction.receiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View Receipt ({transaction.receiptFileName})
                                  </a>
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Comments (optional for approval, required for rejection)
                                </label>
                                <Textarea
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  placeholder="Add comments about this transaction..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex space-x-3">
                                <Button 
                                  onClick={() => handleApprove(transaction)}
                                  disabled={updateStatusMutation.isPending}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  onClick={() => handleReject(transaction)}
                                  disabled={updateStatusMutation.isPending}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  There are no pending transactions requiring approval at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
