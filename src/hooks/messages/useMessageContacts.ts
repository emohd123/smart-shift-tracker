
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";

export const useMessageContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) {
        setContacts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let contactsQuery;

        // Admin-like users can message all promoters
        if (isAdminLike(user.role)) {
          // Get all promoters
          const { data: promoterUsers, error: promotersError } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("role", "promoter");

          if (promotersError) {
            console.error("Error fetching promoters:", promotersError);
            return;
          }

          contactsQuery = (promoterUsers || []).map(p => ({
            id: p.id,
            name: p.full_name,
            role: p.role
          }));
        } else {
          // Promoters can only message admins / super admins
          const { data: adminUsers, error: adminsError } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("role", ["admin", "super_admin"]);

          if (adminsError) {
            console.error("Error fetching admins:", adminsError);
            return;
          }

          contactsQuery = (adminUsers || []).map(a => ({
            id: a.id,
            name: a.full_name,
            role: a.role
          }));
        }

        // Convert to User format
        const userContacts: User[] = contactsQuery.map(contact => ({
          id: contact.id,
          name: contact.name,
          role: contact.role,
          email: "",  // Email not needed for display
          metadata: {}
        }));

        setContacts(userContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  return { contacts, loading };
};
