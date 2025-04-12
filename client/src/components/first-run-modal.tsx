import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface FirstRunModalProps {
  onSave: (email: string) => void;
  onClose: () => void;
}

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const FirstRunModal: React.FC<FirstRunModalProps> = ({ onSave, onClose }) => {
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof emailSchema>) => {
    onSave(values.email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-5/6 max-w-md overflow-hidden">
        <div className="p-4 bg-primary text-white">
          <h3 className="text-lg font-bold">Welcome to SafeExit</h3>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <LogOut className="h-16 w-16 text-primary mb-4 mx-auto" />
            <h4 className="text-lg font-medium mb-2">Set up notification recipient</h4>
            <p className="text-gray-900 mb-4">
              Please provide an email address to receive notifications when blocked exits are detected.
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                className="w-full"
              >
                Complete Setup
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default FirstRunModal;
