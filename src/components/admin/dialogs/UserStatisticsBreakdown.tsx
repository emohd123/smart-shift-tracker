import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, Shield, Clock, Search, Download, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  unique_code: string | null;
  role: string;
  verification_status: string | null;
  created_at: string;
  company_name?: string | null;
}

export default function UserStatisticsBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("promoters");

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchTerm ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unique_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const promoters = filteredUsers.filter(u => u.role === 'promoter');
  const companies = filteredUsers.filter(u => u.role === 'company');
  const admins = filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin');
  const pendingVerifications = filteredUsers.filter(u => u.verification_status === 'pending');

  const exportData = (role?: string) => {
    const dataToExport = role ? filteredUsers.filter(u => u.role === role) : filteredUsers;
    const csv = [
      ["Name", "Code", "Role", "Verification Status", "Join Date"].join(","),
      ...dataToExport.map(user => [
        user.full_name || "",
        user.unique_code || "",
        user.role,
        user.verification_status || "N/A",
        format(new Date(user.created_at), "yyyy-MM-dd")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${role || 'all'}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getVerificationBadge = (status: string | null) => {
    if (status === 'verified') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="outline" className="border-orange-500 text-orange-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    } else {
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Not Verified</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Statistics Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of all users by role and verification status
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{promoters.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Promoters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{admins.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{pendingVerifications.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending Verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={() => exportData()}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="promoters">Promoters</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="promoters" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('promoter')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : promoters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No promoters found
                      </TableCell>
                    </TableRow>
                  ) : (
                    promoters.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.unique_code || "N/A"}</TableCell>
                        <TableCell>{getVerificationBadge(user.verification_status)}</TableCell>
                        <TableCell>{format(new Date(user.created_at), "MMM dd, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('company')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.company_name || user.full_name || "N/A"}
                        </TableCell>
                        <TableCell>{user.full_name || "N/A"}</TableCell>
                        <TableCell>{getVerificationBadge(user.verification_status)}</TableCell>
                        <TableCell>{format(new Date(user.created_at), "MMM dd, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('admin')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No admins found
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.created_at), "MMM dd, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData()}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : pendingVerifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No pending verifications
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingVerifications.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || user.company_name || "N/A"}
                        </TableCell>
                        <TableCell>{user.unique_code || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.created_at), "MMM dd, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
