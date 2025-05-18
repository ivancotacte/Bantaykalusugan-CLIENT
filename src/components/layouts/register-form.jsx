import { useState, useEffect } from "react";
import { GalleryVerticalEnd, HeartPulse, Activity, Scale, Check, Loader2, Users, Clock } from "lucide-react";
import { io } from "socket.io-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RegisterForm({ className, ...props }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [countdown, setCountdown] = useState(120);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    contactNumber: "",
    gender: ""
  });
  const [userId, setUserId] = useState(null);
  const [healthData, setHealthData] = useState({
    heartRate: null,
    SpO2: null,
    weight: null,
    timestamp: null,
  });
  const [submissionState, setSubmissionState] = useState({
    loading: false,
    success: false,
    error: false,
  });
  const [queueStatus, setQueueStatus] = useState({
    inQueue: false,
    position: null,
    totalInQueue: 0,
    currentUser: null
  });
  const [socket, setSocket] = useState(null);

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
        setUserId(data.data.userId);
        checkQueueStatus(data.data.userId);
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

  const checkQueueStatus = async (userId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/queue/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        if (data.data.canProceed) {
          setIsSubmitted(true);
          setIsAnimating(true);
          setQueueStatus({
            inQueue: false,
            position: 0,
            totalInQueue: 0,
            currentUser: userId
          });
        } else {
          setQueueStatus({
            inQueue: true,
            position: data.data.position,
            totalInQueue: data.data.totalInQueue,
            currentUser: data.data.currentUser
          });
          startQueuePolling(userId);
        }
      }
    } catch (error) {
      console.error("Queue check error:", error);
    }
  };

  const startQueuePolling = (userId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/queue/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
          },
          body: JSON.stringify({ userId })
        });

        const data = await response.json();
        if (data.success && data.data.canProceed) {
          clearInterval(interval);
          setIsSubmitted(true);
          setIsAnimating(true);
          setQueueStatus({
            inQueue: false,
            position: 0,
            totalInQueue: 0,
            currentUser: userId
          });
        } else if (data.success) {
          setQueueStatus({
            inQueue: true,
            position: data.data.position,
            totalInQueue: data.data.totalInQueue,
            currentUser: data.data.currentUser
          });
        }
      } catch (error) {
        console.error("Queue polling error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleHealthDataSubmit = async () => {
    setSubmissionState({ loading: true, success: false, error: false });
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          heartRate: healthData.heartRate,
          SpO2: healthData.SpO2,
          weight: healthData.weight,
          userId: userId,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save health data");
      }
      
      setSubmissionState({ loading: false, success: true, error: false });
      
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/queue/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({ userId })
      });

    } catch (error) {
      console.error("Health data submission error:", error);
      setSubmissionState({ loading: false, success: false, error: true });
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmissionState({ loading: false, success: false, error: false });
    setHealthData({
      heartRate: null,
      SpO2: null,
      weight: null,
      timestamp: null,
    });
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      age: "",
      contactNumber: "",
      gender: ""
    });
    setQueueStatus({
      inQueue: false,
      position: null,
      totalInQueue: 0,
      currentUser: null
    });

    if (userId) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/queue/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({ userId })
      }).catch(console.error);
    }

    if (socket) {
      socket.disconnect();
    }
  };

  useEffect(() => {
    if (!isSubmitted) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket:", newSocket.id);
      setConnectionStatus("connected");
    });
    
    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });
    
    newSocket.on("healthData", (payload) => {
      console.log("Received health data:", payload);
      setHealthData((prevData) => ({
        ...prevData,
        ...payload,
      }));
    });

    newSocket.on("queueUpdate", (data) => {
      if (data.userId === userId && data.canProceed) {
        setIsSubmitted(true);
        setIsAnimating(true);
        setQueueStatus({
          inQueue: false,
          position: 0,
          totalInQueue: 0,
          currentUser: userId
        });
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [isSubmitted, userId]);

  useEffect(() => {
    if (isSubmitted && 
        healthData.heartRate && 
        healthData.SpO2 && 
        healthData.weight && 
        !submissionState.loading && 
        !submissionState.success) {
      handleHealthDataSubmit();
    }
  }, [healthData, isSubmitted]);

  useEffect(() => {
    if (isSubmitted) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            resetForm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSubmitted]);

  if (queueStatus.inQueue) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-8 p-6 h-screen", className)} {...props}>
        <div className="text-center space-y-6 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">You're in Queue</h1>
            <p className="text-muted-foreground">
              Please wait for your turn to use the health monitoring system.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Your Position</h3>
                  <p className="text-sm text-muted-foreground">
                    {queueStatus.totalInQueue} {queueStatus.totalInQueue === 1 ? 'person' : 'people'} in queue
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold">{queueStatus.position}</span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Estimated wait time: {Math.max(1, queueStatus.position) * 2} minutes</p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={resetForm}
          >
            Leave Queue
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col items-center gap-8 p-6", className)} {...props}>
        {/* Success Dialog */}
        <Dialog open={submissionState.success} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center mt-4">Health Data Submitted!</DialogTitle>
              <DialogDescription className="text-center">
                Your health metrics have been successfully recorded.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-4">
              <Button 
                className="w-full max-w-xs" 
                onClick={resetForm}
              >
                Register Another User
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading Dialog */}
        <Dialog open={submissionState.loading} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <DialogTitle className="text-center mt-4">Submitting Health Data</DialogTitle>
              <DialogDescription className="text-center">
                Please wait while we save your health metrics...
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <Dialog open={submissionState.error} onOpenChange={() => setSubmissionState(prev => ({ ...prev, error: false }))}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <DialogTitle className="text-center mt-4">Submission Failed</DialogTitle>
              <DialogDescription className="text-center">
                There was an error saving your health data. Please try again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                className="w-full max-w-xs mr-2" 
                onClick={() => setSubmissionState(prev => ({ ...prev, error: false }))}
              >
                Cancel
              </Button>
              <Button 
                className="w-full max-w-xs" 
                onClick={handleHealthDataSubmit}
              >
                Retry
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {submissionState.success ? "Health Data Recorded" : "Registration Successful!"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {connectionStatus === "connecting" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting to your health monitoring device...</span>
              </>
            )}
            {connectionStatus === "connected" && !submissionState.success && (
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
          <p className="text-sm text-muted-foreground">
            Returning to registration in {countdown} seconds...
          </p>
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

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={resetForm}
          >
            Back to Registration
          </Button>
        </div>
      </div>
    );
  }

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
      
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>

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