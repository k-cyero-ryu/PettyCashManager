import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

const replenishmentSchema = z.object({
  requestedAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  reason: z.string().min(1, "Reason is required"),
});

type ReplenishmentFormData = z.infer<typeof replenishmentSchema>;

export default function Replenishment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<ReplenishmentFormData>({
    resolver: zodResolver(replenishmentSchema),
    defaultValues: {
      requestedAmount: "",
      reason: "",
    },
  });

  const { data: replenishments, isLoading } = useQuery({
    queryKey: ["/api/replenishments"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/transactions/stats"],
  });

  const createReplenishmentMutation = useMutation({
    mutationFn: async (data: ReplenishmentFormData) => {
      await apiRequest("POST", "/api/replenishments", {
        requestedAmount: parseFloat(data.requestedAmount).toFixed(2),
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/replenishments"] });
      toast({
        title: "Success",
        description: "Replenishment request submitted successfully",
      });
      form.reset();
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit replenishment request",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments?: string }) => {
      await apiRequest("PATCH", `/api/replenishments/${id}/status`, { status, comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/replenishments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Replenishment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update replenishment status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReplenishmentFormData) => {
    createReplenishmentMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const currentBalance = stats?.currentBalance || 0;
  const isLowBalance = currentBalance < 1500;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Cash Replenishment</h2>
              <p className="text-gray-500 text-sm mt-1">Request and manage cash float replenishments</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${isLowBalance ? 'bg-orange-100' : 'bg-green-100'}`}>
                <p className={`font-semibold text-lg ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
                  ${currentBalance.toFixed(2)}
                </p>
                <p className={`text-xs ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
                  Current Balance
                </p>
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Request Replenishment</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Cash Replenishment</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="requestedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Requested *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-8"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Replenishment *</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Explain why replenishment is needed..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createReplenishmentMutation.isPending}>
                          {createReplenishmentMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Low Balance Warning */}
          {isLowBalance && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-800">Low Balance Alert</h3>
                  <p className="text-orange-700 text-sm">
                    Current balance (${currentBalance.toFixed(2)}) is below the recommended minimum of $1,500. 
                    Consider requesting replenishment to maintain adequate cash flow.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Replenishment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
                  ))}
                </div>
              ) : replenishments?.length > 0 ? (
                <div className="space-y-4">
                  {replenishments.map((replenishment: any) => (
                    <div key={replenishment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              ${parseFloat(replenishment.requestedAmount).toFixed(2)}
                            </h4>
                            {getStatusBadge(replenishment.status)}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{replenishment.reason}</p>
                          <div className="text-xs text-gray-500">
                            Requested on {new Date(replenishment.createdAt).toLocaleDateString()}
                          </div>
                          {replenishment.comments && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Comments: </span>
                              {replenishment.comments}
                            </div>
                          )}
                        </div>
                        {replenishment.status === "pending" && user?.role !== "custodian" && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: replenishment.id, 
                                status: "approved" 
                              })}
                              disabled={updateStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: replenishment.id, 
                                status: "rejected",
                                comments: "Rejected by administrator"
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Replenishment Requests</h3>
                  <p className="text-gray-600">
                    No replenishment requests have been submitted yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}