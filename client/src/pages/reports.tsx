import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, FileText, Filter } from "lucide-react";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/transactions/stats"],
  });

  const handleExport = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (statusFilter !== "all") params.set("status", statusFilter);
    
    const url = `/api/export/transactions?${params.toString()}`;
    window.open(url, "_blank");
  };

  const filteredTransactions = transactions?.filter((transaction: any) => {
    const transactionDate = new Date(transaction.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && transactionDate < start) return false;
    if (end && transactionDate > end) return false;
    if (statusFilter !== "all" && transaction.status !== statusFilter) return false;
    
    return true;
  }) || [];

  const totalAmount = filteredTransactions.reduce((sum: number, transaction: any) => {
    return sum + Math.abs(parseFloat(transaction.amount));
  }, 0);

  const approvedCount = filteredTransactions.filter((t: any) => t.status === "approved").length;
  const pendingCount = filteredTransactions.filter((t: any) => t.status === "pending").length;
  const rejectedCount = filteredTransactions.filter((t: any) => t.status === "rejected").length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
              <p className="text-gray-500 text-sm mt-1">Generate and export petty cash reports</p>
            </div>
            <Button onClick={handleExport} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Report Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      {filteredTransactions.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Amount</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      ${totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Current Balance</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      ${(stats?.currentBalance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Average Transaction</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      ${(stats?.averageTransaction || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-green-600">{approvedCount}</span>
                  </div>
                  <p className="font-medium text-gray-900">Approved</p>
                  <p className="text-sm text-gray-500">Completed transactions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-orange-600">{pendingCount}</span>
                  </div>
                  <p className="font-medium text-gray-900">Pending</p>
                  <p className="text-sm text-gray-500">Awaiting approval</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-red-600">{rejectedCount}</span>
                  </div>
                  <p className="font-medium text-gray-900">Rejected</p>
                  <p className="text-sm text-gray-500">Declined transactions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Filtered Transactions Preview</CardTitle>
              <p className="text-sm text-gray-500">
                Showing {filteredTransactions.length} transactions
                {startDate || endDate ? ` from ${startDate || 'beginning'} to ${endDate || 'present'}` : ''}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded" />
                  ))}
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                  {filteredTransactions.slice(0, 10).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.receivedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          -${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredTransactions.length > 10 && (
                    <p className="text-center text-gray-500 text-sm">
                      And {filteredTransactions.length - 10} more transactions...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-gray-600">
                    No transactions match your current filter criteria.
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