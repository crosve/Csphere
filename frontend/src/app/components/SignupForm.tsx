"use client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  username: z.string().min(1).min(5).max(50),
  email: z.string(),
  password: z.string(),
  confirmpassword: z.string(),
});

interface GoogleUserData {
  username: String;
  email: String;
  google_id: string;
}

interface GoogleDecodeInterface {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}

interface ResponseData {
  success: boolean;
  message: string;
  token: string;
}

export default function SignupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
    },
  });

  const router = useRouter();

  const googleSignUp = async (credentials: any) => {
    try {
      const data: GoogleDecodeInterface = jwtDecode(credentials.credential);

      const googleUserInfo: GoogleUserData = {
        username: data.name,
        email: data.email,
        google_id: data.sub,
      };

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/google/signup`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleUserInfo),
      });

      if (!response.ok) {
        console.error("Signup failed", await response.text());
        return;
      }

      const responseData: ResponseData = await response.json();
      console.log("data:", responseData);

      if (responseData.success === true) {
        document.cookie = `token=${responseData.token}; path=/; max-age=3600`;
        router.push("/home");
      }
    } catch (error) {
      console.error("Google signup error:", error);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>): Promise<void> {
    try {
      console.log(values);
      if (values.password !== values.confirmpassword) {
        toast.error("Passwords do not match.");
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json();
        console.error("HTTP Error:", responseBody);
        toast.error(responseBody.detail || "Signup failed. Please try again.");
        return;
      }

      toast.success("Signup successful!");
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="text-black space-y-3"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" type="text" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email </FormLabel>
              <FormControl>
                <Input placeholder="Email " type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmpassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Pasword</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Confirm Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="bg-[#202A29] hover:bg-gray-600 transition-all duration-200 text-white font-semibold py-2 px-4 rounded w-full"
          type="submit"
        >
          Submit
        </Button>
      </form>
      <hr className="border-black mb-4" />
      <GoogleLogin
        onSuccess={(credentials) => googleSignUp(credentials)}
        onError={() => toast.error("Failed to signup with google.")}
        text="signup_with"
        width="350px"
        shape="pill"
      />

      <div className="text-center text-gray-400 mt-4">
        <p className="text-sm">Have an account?</p>
        <Link href="/login">
          <Button variant="link" className="text-blue-500 hover:text-blue-700">
            Log In
          </Button>
        </Link>
      </div>
    </Form>
  );
}
