import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiPost } from "../renderer/services/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Pill,
} from "lucide-react";

const signupSchema = z
  .object({
    shop_name: z.string().min(1, "Shop name is required"),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      shop_name: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: SignupValues) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiPost("/auth/register", {
        shop_name: values.shop_name,
        name: values.name,
        email: values.email,
        password: values.password,
      });

      const token = res?.token || res?.data?.token;
      const user = res?.user || res?.data?.user;

      if (!token || !user) {
        setError("Signup response invalid. Please try again.");
        setIsLoading(false);
        return;
      }

      login(token, user);
      navigate("/pos");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-[#111111] border border-[#2a2a2a] shadow-xl">
        <CardHeader className="pb-6 pt-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl text-white">Pharmacy POS</CardTitle>
              <p className="text-sm text-[#8a8a8a]">
                Create your account
              </p>
            </div>
            <div className="h-0.5 w-8 rounded-full bg-primary/40" />
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 text-left">
              <FormField
                control={form.control}
                name="shop_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white">Shop Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
                        <Input
                          placeholder="Your pharmacy name"
                          autoComplete="organization"
                          autoFocus
                          className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-white placeholder:text-[#555555] pl-10 focus-visible:ring-primary focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white">Your Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
                        <Input
                          placeholder="Admin name"
                          autoComplete="name"
                          className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-white placeholder:text-[#555555] pl-10 focus-visible:ring-primary focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
                        <Input
                          placeholder="name@pharmacy.com"
                          autoComplete="email"
                          className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-white placeholder:text-[#555555] pl-10 focus-visible:ring-primary focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-white placeholder:text-[#555555] pl-10 pr-10 focus-visible:ring-primary focus-visible:ring-offset-0"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-white placeholder:text-[#555555] pl-10 pr-10 focus-visible:ring-primary focus-visible:ring-offset-0"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-[#3e1f1f] bg-[#1c1010] px-4 py-3 text-sm text-[#f87171]">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium gap-2 bg-green-600 text-white hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <UserPlus className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-[#8a8a8a]">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
