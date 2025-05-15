
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createMedicine, updateMedicine, Medicine } from "@/services/AdminService";

interface MedicineFormProps {
  medicine?: Medicine;
  onComplete: () => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, onComplete }) => {
  const queryClient = useQueryClient();
  const isEditing = !!medicine;
  
  const form = useForm({
    defaultValues: {
      name: medicine?.name || "",
      dosage: medicine?.dosage || "",
    },
  });

  const createMedicineMutation = useMutation({
    mutationFn: createMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Success",
        description: "Medicine created successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create medicine",
        variant: "destructive",
      });
      console.error("Error creating medicine:", error);
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: ({ id, medicineData }: { id: string; medicineData: Partial<Medicine> }) => 
      updateMedicine(id, medicineData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      toast({
        title: "Success",
        description: "Medicine updated successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update medicine",
        variant: "destructive",
      });
      console.error("Error updating medicine:", error);
    },
  });

  const onSubmit = (data) => {
    if (isEditing) {
      updateMedicineMutation.mutate({ 
        id: medicine.id, 
        medicineData: data 
      });
    } else {
      createMedicineMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medicine Name</FormLabel>
              <FormControl>
                <Input placeholder="Paracetamol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosage</FormLabel>
              <FormControl>
                <Input placeholder="500mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending}
          >
            {isEditing ? "Update Medicine" : "Create Medicine"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MedicineForm;
