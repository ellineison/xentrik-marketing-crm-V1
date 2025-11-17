import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DeleteUserByEmail = () => {
  const [email, setEmail] = useState("jjasminelilyy@gmail.com");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-by-email', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || `User ${email} deleted successfully`,
      });
      setEmail("");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="email"
        placeholder="Enter email to delete"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleDelete} disabled={loading} variant="destructive">
        {loading ? "Deleting..." : "Delete User"}
      </Button>
    </div>
  );
};
