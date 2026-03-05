import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Phone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const phoneSchema = z.object({
  phone: z.string().min(9, "Please enter a valid phone number").regex(/^\+?[0-9]{9,15}$/, "Invalid phone number format"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface PhoneOTPAuthProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PhoneOTPAuth: React.FC<PhoneOTPAuthProps> = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+237" },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleSendOTP = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = data.phone.startsWith("+") ? data.phone : `+${data.phone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        if (error.message.includes("not enabled")) {
          toast.error("SMS authentication is not yet configured. Please use email or Google sign-in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setPhoneNumber(formattedPhone);
      setStep("otp");
      toast.success("Verification code sent to your phone!");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: data.otp,
        type: "sms",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Phone verified successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("New code sent!");
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Verify your phone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
        </div>

        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-6">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
          </form>
        </Form>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResendOTP}
            disabled={isLoading}
            className="text-sm"
          >
            Didn't receive code? Resend
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep("phone")}
            className="text-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Change phone number
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Sign in with Phone</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send you a verification code
        </p>
      </div>

      <Form {...phoneForm}>
        <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
          <FormField
            control={phoneForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    {...field}
                    className="text-lg h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Verification Code
          </Button>
        </form>
      </Form>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to other options
      </Button>
    </div>
  );
};

export default PhoneOTPAuth;
