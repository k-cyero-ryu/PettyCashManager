import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, Trash2, FileText, Image } from "lucide-react";

interface Receipt {
  id: number;
  fileName: string;
  originalName: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

interface ReceiptListProps {
  transactionId: number;
  canDelete?: boolean;
}

export default function ReceiptList({ transactionId, canDelete = false }: ReceiptListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receipts, isLoading } = useQuery<Receipt[]>({
    queryKey: [`/api/transactions/${transactionId}/receipts`],
  });

  const deleteMutation = useMutation({
    mutationFn: async (receiptId: number) => {
      await apiRequest("DELETE", `/api/receipts/${receiptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${transactionId}/receipts`] });
      toast({
        title: "Success",
        description: "Receipt deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />
        ))}
      </div>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No receipts attached</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        Receipts ({receipts.length})
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {receipts.map((receipt: Receipt) => (
          <div
            key={receipt.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded border"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-gray-600">
                {getFileIcon(receipt.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {receipt.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(receipt.fileSize)} • {new Date(receipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(receipt.url, '_blank')}
                className="h-8 w-8 p-0"
                title="View receipt"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(receipt.id)}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete receipt"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}