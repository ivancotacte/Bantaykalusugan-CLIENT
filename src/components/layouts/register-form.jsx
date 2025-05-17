import { useState, useEffect } from "react";
import { GalleryVerticalEnd, HeartPulse, Activity, Scale, Check, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RegisterForm({ className, ...props }) {
  // State management
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    contactNumber: "",
    gender: ""
  });
  const [healthData, setHealthData] = useState({
    heartRate: null,
    SpO2: null,
    weight: null
  });

  // Form handlers
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setIsSubmitted(true);
        setIsAnimating(true);
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthDataSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/health-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify(healthData)
      });

      if (!response.ok) {
        throw new Error("Failed to save health data");
      }
      
      alert("Health data saved successfully!");
    } catch (error) {
      console.error("Health data submission error:", error);
      alert("Failed to save health data. Please try again.");
    }
  };

  // Socket connection for health data
  useEffect(() => {
    if (!isSubmitted) return;

    const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
      setConnectionStatus("connected");
    });
    
    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });
    
    socket.on("healthData", (payload) => {
      setHealthData(payload);
      setConnectionStatus("receiving-data");
    });

    return () => socket.disconnect();
  }, [isSubmitted]);

  // Health monitoring view
  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col items-center gap-8 p-6", className)} {...props}>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Registration Successful!</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {connectionStatus === "connecting" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting to your health monitoring device...</span>
              </>
            )}
            {connectionStatus === "connected" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for data from device...</span>
              </>
            )}
            {connectionStatus === "receiving-data" && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Device connected and receiving data</span>
              </>
            )}
            {connectionStatus === "disconnected" && (
              <>
                <span className="text-red-500">Device disconnected. Please check your connection.</span>
              </>
            )}
          </div>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-6">
            {/* Heart Rate Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <HeartPulse className="h-6 w-6 text-red-500 animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-medium">Heart Rate</h3>
                  <p className="text-xs text-muted-foreground">Place your finger on the sensor</p>
                </div>
                <span className="ml-auto font-mono text-lg">
                  {healthData.heartRate ? `${healthData.heartRate} bpm` : '--'}
                </span>
              </div>
              <div className="h-12 relative">
                {isAnimating && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-full w-full flex items-end">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const height = healthData.heartRate 
                          ? Math.min(100, Math.max(10, (healthData.heartRate - 50) * 0.5 + Math.random() * 15))
                          : 10 + Math.random() * 20;
                        return (
                          <div
                            key={i}
                            className="h-1 bg-red-500 rounded-full mx-0.5"
                            style={{
                              height: `${height}%`,
                              width: "4px",
                              animation: `pulse ${0.4 + Math.random() * 0.4}s infinite alternate`,
                              animationDelay: `${i * 0.05}s`
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blood Oxygen Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-blue-500 animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-medium">Blood Oxygen (SpO₂)</h3>
                  <p className="text-xs text-muted-foreground">Keep your finger steady on the sensor</p>
                </div>
                <span className="ml-auto font-mono text-lg">
                  {healthData.SpO2 ? `${healthData.SpO2}%` : '--'}
                </span>
              </div>
              <div className="h-12 relative">
                {isAnimating && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-full w-full flex items-end">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const height = healthData.SpO2 
                          ? Math.min(100, Math.max(10, (healthData.SpO2 - 85) * 2 + Math.random() * 10))
                          : 10 + Math.random() * 20;
                        return (
                          <div
                            key={i}
                            className="h-1 bg-blue-500 rounded-full mx-0.5"
                            style={{
                              height: `${height}%`,
                              width: "4px",
                              animation: `pulse ${0.6 + Math.random() * 0.4}s infinite`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weight Section */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-medium">Weight</h3>
                  <p className="text-xs text-muted-foreground">Step onto the scale and stand still</p>
                </div>
                <span className="ml-auto font-mono text-lg">
                  {healthData.weight ? `${healthData.weight} kg` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsSubmitted(false)}
            >
              Back
            </Button>
            <Button 
              className="w-full" 
              onClick={handleHealthDataSubmit}
              disabled={!healthData.heartRate || !healthData.SpO2 || !healthData.weight}
            >
              Submit Health Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form view
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleRegisterSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Health Monitor</span>
            </a>
            <div className='space-y-1 text-center'>
              <h1 className="text-xl font-bold">Register for Health Monitoring System</h1>
              <p className='text-muted-foreground'>Create your account to start tracking your health</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="30"
                  min="0"
                  max="120"
                  required
                  value={formData.age}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  required
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {/* Gender Selection */}
            <div className="grid gap-3">
              <Label htmlFor="gender">Gender</Label>
              <Select
                required
                value={formData.gender}
                onValueChange={handleGenderChange}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : "Register"}
            </Button>
          </div>
        </div>
      </form>
      
      {/* Footer */}
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scaleY(0.9); opacity: 0.7; }
          50% { transform: scaleY(1.1); opacity: 1; }
          100% { transform: scaleY(0.9); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}