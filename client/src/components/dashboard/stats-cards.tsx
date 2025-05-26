import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Plus, Calculator } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    currentBalance: number;
    monthlyTotal: number;
    pendingCount: number;
    averageTransaction: number;
    totalTransactions: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const statsData = [
    {
      title: "This Month",
      value: formatCurrency(stats?.monthlyTotal || 0),
      subtitle: `Based on ${stats?.totalTransactions || 0} transactions`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingCount?.toString() || "0",
      subtitle: "Awaiting review",
      icon: Clock,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Last 30 Days",
      value: formatCurrency(stats?.monthlyTotal || 0),
      subtitle: "Total expenses",
      icon: Plus,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Average Transaction",
      value: formatCurrency(stats?.averageTransaction || 0),
      subtitle: `Based on ${stats?.totalTransactions || 0} transactions`,
      icon: Calculator,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-gray-500 text-sm font-medium mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
