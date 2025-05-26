import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: string;
  submitterName?: string;
  submitterEmail?: string;
  receivedBy: string;
  paymentMethod: string;
  date: string;
}

interface ApprovalCardProps {
  transaction: Transaction;
}

export default function ApprovalCard({ transaction }: ApprovalCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      await apiRequest("PATCH", `/api/transactions/${transaction.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: "approved" });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: "rejected" });
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900">{transaction.description}</h4>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Amount:</span> ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Submitted by:</span> {transaction.submitterName || transaction.submitterEmail}
            </p>
            <p>
              <span className="font-medium">Received by:</span> {transaction.receivedBy}
            </p>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={updateStatusMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={updateStatusMutation.isPending}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
