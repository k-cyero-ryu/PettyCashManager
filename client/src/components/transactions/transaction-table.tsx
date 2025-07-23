import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: string;
  receivedBy: string;
  paymentMethod: string;
  status: string;
  runningBalance: string;
  receiptUrl?: string;
  receiptFileName?: string;
  submitterName?: string;
  submitterEmail?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TransactionTable({ 
  transactions, 
  isLoading, 
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange 
}: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    const isPositive = num > 0;
    return (
      <span className={isPositive ? "text-green-600" : "text-red-600"}>
        {isPositive ? "+" : ""}${Math.abs(num).toFixed(2)}
      </span>
    );
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    if (transaction.receiptUrl) {
      window.open(transaction.receiptUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-16 rounded" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      Received by: {transaction.receivedBy}
                    </p>
                    {transaction.submitterName && (
                      <p className="text-sm text-gray-500">
                        Submitted by: {transaction.submitterName}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatAmount(transaction.amount)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell className="font-semibold">
                  ${parseFloat(transaction.runningBalance || "0").toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {transaction.receiptUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(transaction)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">{selectedTransaction.description}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-lg">
                      {formatAmount(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(selectedTransaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Received By</p>
                    <p className="font-medium">{selectedTransaction.receivedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-medium capitalize">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Running Balance</p>
                    <p className="font-medium">
                      ${parseFloat(selectedTransaction.runningBalance || "0").toFixed(2)}
                    </p>
                  </div>
                </div>
                {selectedTransaction.submitterName && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm">Submitted By</p>
                    <p className="font-medium">{selectedTransaction.submitterName}</p>
                  </div>
                )}
              </div>
              
              {selectedTransaction.receiptUrl ? (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Receipt</p>
                  <a 
                    href={selectedTransaction.receiptUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    View Receipt ({selectedTransaction.receiptFileName})
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm">No receipt attached</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
