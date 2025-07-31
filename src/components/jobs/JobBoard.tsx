import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, DollarSign, Clock, Users, Star, Search, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  pay_rate: number;
  pay_rate_type: string;
  job_type: string;
  requirements: string[];
  benefits: string[];
  start_date: string;
  end_date: string;
  positions_available: number;
  is_premium: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  status: string;
  created_at: string;
  employer_id: string;
}

export default function JobBoard() {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedJobType, setSelectedJobType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, selectedLocation, selectedJobType]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error("Failed to load job postings");
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (selectedJobType !== "all") {
      filtered = filtered.filter(job => job.job_type === selectedJobType);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to apply for jobs");
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: jobId,
          applicant_id: (await supabase.auth.getUser()).data.user?.id,
          cover_letter: "",
          status: 'pending'
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.info("You have already applied for this job");
        } else {
          throw error;
        }
      } else {
        toast.success("Application submitted successfully!");
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error("Failed to submit application");
    }
  };

  const formatPayRate = (rate: number, type: string) => {
    const currency = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(rate);

    return `${currency}/${type}`;
  };

  const getJobTypeColor = (type: string) => {
    const colors = {
      promotion: 'bg-blue-100 text-blue-800',
      event: 'bg-purple-100 text-purple-800',
      retail: 'bg-green-100 text-green-800',
      hospitality: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Job Board</h2>
        <p className="text-muted-foreground">
          Discover exciting opportunities in promotion and events
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="london">London</SelectItem>
                <SelectItem value="manchester">Manchester</SelectItem>
                <SelectItem value="birmingham">Birmingham</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger>
                <SelectValue placeholder="All job types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedLocation("all");
              setSelectedJobType("all");
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className={`transition-shadow hover:shadow-lg ${job.is_featured ? 'border-primary bg-primary/5' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    {job.is_featured && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
                    {job.is_urgent && <Badge className="bg-red-500">Urgent</Badge>}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatPayRate(job.pay_rate, job.pay_rate_type)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.positions_available} position{job.positions_available !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <Badge className={getJobTypeColor(job.job_type)}>
                  {job.job_type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="text-base">
                {job.description}
              </CardDescription>

              {job.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
                
                <Button onClick={() => handleApply(job.id)}>
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}