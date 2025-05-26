import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TransactionTable from "@/components/transactions/transaction-table";
import TransactionForm from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download } from "lucide-react";

export default function Transactions() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", { 
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit,
      offset: (currentPage - 1) * limit 
    }],
  });

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    
    const url = `/api/export/transactions?${params.toString()}`;
    window.open(url, "_blank");
  };

  const filteredTransactions = transactions?.filter((transaction: any) =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.receivedBy.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Transactions</h2>
              <p className="text-gray-500 text-sm mt-1">Manage all petty cash transactions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleExport} className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>New Transaction</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <TransactionForm onSuccess={() => setShowTransactionForm(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {/* Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={filteredTransactions} 
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={Math.ceil((transactions?.length || 0) / limit)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
