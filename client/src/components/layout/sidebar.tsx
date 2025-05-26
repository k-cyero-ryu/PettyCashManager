import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  BarChart3, 
  List, 
  CheckCircle, 
  PlusCircle, 
  FileText, 
  Calculator,
  Settings,
  Users,
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Transactions", href: "/transactions", icon: List },
    ...(user?.role !== "custodian" ? [
      { name: "Approvals", href: "/approvals", icon: CheckCircle }
    ] : []),
    { name: "Replenishment", href: "/replenishment", icon: PlusCircle },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Reconciliation", href: "/reconciliation", icon: Calculator },
    ...(user?.role === "admin" ? [
      { name: "Users", href: "/users", icon: Users }
    ] : []),
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "custodian":
        return "Custodian";
      case "accountant":
        return "Accountant";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-40">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PettyCash</h1>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500">{getRoleDisplay()}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 ${
                  isActive 
                    ? "bg-primary bg-opacity-10 text-primary hover:bg-primary hover:bg-opacity-20" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Settings and Logout */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-gray-600 hover:bg-gray-100"
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium">Settings</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start space-x-3 text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
