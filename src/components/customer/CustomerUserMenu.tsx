import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Package, Heart, Settings, LogOut } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import CustomerAuthDialog from "./CustomerAuthDialog";

const CustomerUserMenu: React.FC = () => {
  const { user, profile, signOut } = useCustomerAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setAuthDialogOpen(true)}>
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <CustomerAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my-account">
            <User className="mr-2 h-4 w-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-account/orders">
            <Package className="mr-2 h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-account/favorites">
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-account/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomerUserMenu;
