import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Shield, TrendingUp, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">PettyCash Manager</h1>
              <p className="text-xl text-gray-600">Streamline your petty cash management</p>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            A comprehensive solution for tracking, approving, and managing petty cash transactions 
            with role-based access and complete audit trails.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Role-based access control ensures only authorized personnel can approve transactions 
                and manage funds.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor cash flow, track expenses, and maintain accurate running balances 
                with automatic calculations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Streamlined approval workflows with notifications keep your team informed 
                and transactions moving efficiently.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold mb-4">Ready to get started?</h3>
              <p className="text-gray-600 mb-6">
                Access your petty cash management dashboard and start tracking transactions today.
              </p>
              <Button onClick={handleLogin} size="lg" className="w-full">
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
