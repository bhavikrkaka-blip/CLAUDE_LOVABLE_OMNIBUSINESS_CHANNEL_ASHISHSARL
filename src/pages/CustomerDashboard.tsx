import { useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Heart, Settings, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CustomerDashboard = () => {
  const { user, profile, isLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
            <p className="text-muted-foreground mb-6">
              Access your orders, favorites, and account settings
            </p>
            <Button asChild className="w-full">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentTab = location.pathname.includes("/orders")
    ? "orders"
    : location.pathname.includes("/favorites")
    ? "favorites"
    : location.pathname.includes("/settings")
    ? "settings"
    : "profile";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>

        <Tabs value={currentTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" asChild>
              <Link to="/my-account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="orders" asChild>
              <Link to="/my-account/orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="favorites" asChild>
              <Link to="/my-account/favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="settings" asChild>
              <Link to="/my-account/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;
