import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const CustomerProfile = () => {
  const { user, profile } = useCustomerAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{profile?.full_name || "Not set"}</h3>
                <Badge variant="secondary" className="mt-1">Customer</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email || user?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.address}, {profile.city}</span>
                  </div>
                )}
                {user?.created_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {format(new Date(user.created_at), "MMM yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProfile;
