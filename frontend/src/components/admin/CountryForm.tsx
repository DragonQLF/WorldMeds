
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createCountry, updateCountry, Country } from "@/services/AdminService";

interface CountryFormProps {
  country?: Country;
  onComplete: () => void;
}

const CountryForm: React.FC<CountryFormProps> = ({ country, onComplete }) => {
  const queryClient = useQueryClient();
  const isEditing = !!country;
  
  const form = useForm({
    defaultValues: {
      name: country?.name || "",
      currency: country?.currency || "",
    },
  });

  const createCountryMutation = useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Success",
        description: "Country created successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create country",
        variant: "destructive",
      });
      console.error("Error creating country:", error);
    },
  });

  const updateCountryMutation = useMutation({
    mutationFn: ({ id, countryData }: { id: string; countryData: Partial<Country> }) => 
      updateCountry(id, countryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast({
        title: "Success",
        description: "Country updated successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update country",
        variant: "destructive",
      });
      console.error("Error updating country:", error);
    },
  });

  const onSubmit = (data) => {
    if (isEditing) {
      updateCountryMutation.mutate({ 
        id: country.id, 
        countryData: data 
      });
    } else {
      createCountryMutation.mutate(data);
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
              <FormLabel>Country Name</FormLabel>
              <FormControl>
                <Input placeholder="Brazil" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Name</FormLabel>
              <FormControl>
                <Input placeholder="Brazilian Real" {...field} />
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
            disabled={createCountryMutation.isPending || updateCountryMutation.isPending}
          >
            {isEditing ? "Update Country" : "Create Country"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CountryForm;
