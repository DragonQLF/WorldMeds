import React from "react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { UserPlus, Pencil, Trash2, Users, Pill, Map, Activity, Search, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchUsers, 
  fetchMedicines, 
  fetchCountries, 
  fetchDashboardStats,
  fetchMedicineTransactions,
  deleteUser, 
  deleteMedicine, 
  deleteCountry,
  User,
  Medicine,
  Country,
  MedicineTransaction
} from "@/services/AdminService";
import { connectWebSocket, setOnlineUsersCallback, disconnectWebSocket } from "@/services/websocketService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from "../components/admin/UserForm";
import MedicineForm from "../components/admin/MedicineForm";
import CountryForm from "../components/admin/CountryForm";
import MedicineDetailModal from "@/components/admin/MedicineDetailModal";
import CountryDetailModal from "@/components/admin/CountryDetailModal";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<User | Medicine | Country | null>(null);
  const [viewMedicine, setViewMedicine] = useState<Medicine | null>(null);
  const [viewCountry, setViewCountry] = useState<Country | null>(null);
  const [medicineTransactions, setMedicineTransactions] = useState<MedicineTransaction[] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { user, refreshUserData } = useAuth();
  const queryClient = useQueryClient();

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      connectWebSocket(token);
      
      // Set callback for online users count updates
      setOnlineUsersCallback((count) => {
        setOnlineUsers(count);
      });
    }
    
    // Disconnect when component unmounts
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch users data
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
    enabled: activeTab === "users",
  });

  // Fetch medicines data
  const { data: medicines, isLoading: isLoadingMedicines } = useQuery({
    queryKey: ["admin", "medicines"],
    queryFn: fetchMedicines,
    enabled: activeTab === "medicines",
  });

  // Fetch countries data
  const { data: countries, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: fetchCountries,
    enabled: activeTab === "countries",
  });

  // Delete mutations
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
      console.error("Error deleting user:", error);
    },
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: deleteMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
      console.error("Error deleting medicine:", error);
    },
  });

  const deleteCountryMutation = useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Success",
        description: "Country deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete country",
        variant: "destructive",
      });
      console.error("Error deleting country:", error);
    },
  });

  // Filter data based on search query
  const filteredUsers = users ? users.filter(user => 
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredMedicines = medicines ? medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (medicine.dosage && medicine.dosage.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const filteredCountries = countries ? countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      if (activeTab === "users") {
        deleteUserMutation.mutate(id);
      } else if (activeTab === "medicines") {
        deleteMedicineMutation.mutate(id);
      } else if (activeTab === "countries") {
        deleteCountryMutation.mutate(id);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
    // Refresh user data in Auth context to update sidebar
    refreshUserData();
  };

  // Handle view medicine details
  const handleViewMedicine = async (medicine: Medicine) => {
    setViewMedicine(medicine);
    setIsLoadingDetails(true);
    
    try {
      const transactions = await fetchMedicineTransactions(medicine.id);
      setMedicineTransactions(transactions);
    } catch (error) {
      console.error("Error fetching medicine transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch medicine details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle view country details
  const handleViewCountry = (country: Country) => {
    setViewCountry(country);
  };

  const isLoading = isLoadingStats || 
    (activeTab === "users" && isLoadingUsers) ||
    (activeTab === "medicines" && isLoadingMedicines) ||
    (activeTab === "countries" && isLoadingCountries);

  if (isLoading && !stats && !users && !medicines && !countries) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
              <Pill className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.medicines || 0}</div>
              <p className="text-xs text-muted-foreground">Registered medications</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries Covered</CardTitle>
              <Map className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.countries || 0}</div>
              <p className="text-xs text-muted-foreground">With available data</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Users</CardTitle>
              <Activity className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineUsers}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Tables Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage users, medicines, and country data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <TabsList>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="medicines">Medicines</TabsTrigger>
                  <TabsTrigger value="countries">Countries</TabsTrigger>
                </TabsList>
                
                <div className="flex w-full md:w-auto items-center gap-2">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`Search ${activeTab}...`}
                      className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <Button className="flex items-center gap-2" onClick={handleAdd}>
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden md:inline">Add {activeTab.slice(0, -1)}</span>
                    <span className="md:hidden">Add</span>
                  </Button>
                </div>
              </div>

              <TabsContent value="users" className="m-0">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className="capitalize">{user.role}</span>
                            </TableCell>
                            <TableCell>{user.createdAt}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                  <Pencil className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                  <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            {isLoadingUsers ? "Loading users..." : "No users found matching your search criteria"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="medicines" className="m-0">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Countries</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine) => (
                          <TableRow key={medicine.id}>
                            <TableCell>{medicine.name}</TableCell>
                            <TableCell>{medicine.dosage || "N/A"}</TableCell>
                            <TableCell>{medicine.countryCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewMedicine(medicine)}>
                                  <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(medicine)}>
                                  <Pencil className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(medicine.id)}>
                                  <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            {isLoadingMedicines ? "Loading medicines..." : "No medicines found matching your search criteria"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="countries" className="m-0">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Medicines</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <TableRow key={country.id}>
                            <TableCell>{country.name}</TableCell>
                            <TableCell>{country.currency}</TableCell>
                            <TableCell>{country.medicineCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewCountry(country)}>
                                  <Eye className="h-4 w-4 text-green-500 dark:text-green-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(country)}>
                                  <Pencil className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(country.id)}>
                                  <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            {isLoadingCountries ? "Loading countries..." : "No countries found matching your search criteria"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem 
                ? `Update the ${activeTab.slice(0, -1)} details below.` 
                : `Fill in the details to create a new ${activeTab.slice(0, -1)}.`}
            </DialogDescription>
          </DialogHeader>
          
          {activeTab === "users" && (
            <UserForm 
              user={selectedItem as User} 
              onComplete={handleFormClose} 
            />
          )}
          
          {activeTab === "medicines" && (
            <MedicineForm 
              medicine={selectedItem as Medicine} 
              onComplete={handleFormClose} 
            />
          )}
          
          {activeTab === "countries" && (
            <CountryForm 
              country={selectedItem as Country} 
              onComplete={handleFormClose} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Medicine Detail Modal */}
      <MedicineDetailModal 
        isOpen={!!viewMedicine} 
        onClose={() => setViewMedicine(null)} 
        medicine={viewMedicine}
        transactions={medicineTransactions}
        isLoading={isLoadingDetails}
      />

      {/* Country Detail Modal */}
      <CountryDetailModal 
        isOpen={!!viewCountry} 
        onClose={() => setViewCountry(null)} 
        country={viewCountry}
        isLoading={false}
      />
    </Layout>
  );
};

export default Admin;
