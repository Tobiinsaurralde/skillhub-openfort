import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

// Importación de los componentes de pasos
import StepOne from "@/components/features/ServiceStepOne";
import StepTwo from "@/components/features/ServiceStepTwo";
import StepThree from "@/components/features/ServiceStepThree";
import StepIndicator from "@/components/features/StepIndicator";

import { useWalletAccount } from "@/hooks/useWalletAccount";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const CreateService = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: 10,
    deliveryTime: "3 days",
    revisions: "Unlimited",
    description: "",
    includes: ["High-quality deliverables", "Fast turnaround time"],
    walletAddress: "",
    imageFile: null,
  });
  const [newIncludeItem, setNewIncludeItem] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"; // Define here or use context
  const API_URL = `${API_BASE_URL}/api/services`;
  const { user: walletAddress } = useWalletAccount();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if user has profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!walletAddress) return; // Wait for wallet
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${walletAddress}`);
        if (res.status === 404) {
          toast({
            title: "Profile Required",
            description: "You need to create a profile before offering a service.",
            variant: "destructive"
          });
          navigate("/profile");
        }
      } catch (error) {
        console.error("Error checking profile", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (walletAddress) {
      checkProfile();
    } else {
      // If not connected, maybe just let them see the page but button disabled? 
      // Or wait. For now, let's assume if connected we check.
      setProfileLoading(false);
    }

  }, [walletAddress, navigate, toast, API_BASE_URL]);

  /* Manejador cambios inputs */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* Manejador cambios selects */
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* Manejador carga imagen */
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, imageFile: e.target.files[0] }));
    }
  };

  /* Añadir item a la lista de includes */
  const handleAddIncludeItem = () => {
    const trimmedItem = newIncludeItem.trim();
    if (trimmedItem !== "" && !formData.includes.includes(trimmedItem)) {
      setFormData((prev) => ({
        ...prev,
        includes: [...prev.includes, trimmedItem],
      }));
      setNewIncludeItem("");
    }
  };

  const canAdvance = () => {
    if (step === 1) {
      return (
        formData.title.length >= 5 &&
        formData.category !== "" &&
        Number(formData.price) > 0
      );
    }
    if (step === 2) {
      const wordCount = formData.description
        .split(/\s+/)
        .filter(Boolean).length;
      return (
        wordCount >= 3 &&
        formData.description.length >= 50 &&
        formData.imageFile !== null &&
        formData.includes.length > 0
      );
    }
    return true;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <StepOne
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
          />
        );
      case 2:
        return (
          <StepTwo
            formData={formData}
            handleChange={handleChange}
            handleImageChange={handleImageChange}
            newIncludeItem={newIncludeItem}
            setNewIncludeItem={setNewIncludeItem}
            handleAddIncludeItem={handleAddIncludeItem}
            setFormData={setFormData}
          />
        );
      case 3:
        return <StepThree formData={formData} />;
      default:
        return null;
    }
  };

  const handlePublish = async () => {
    // Explicit check to ensure we are on the last step
    if (step !== 3) return;

    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to publish a service.",
        variant: "destructive"
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const dataToSend = new FormData();

    dataToSend.append("walletAddress", walletAddress);

    dataToSend.append("title", formData.title);
    dataToSend.append("category", formData.category);
    dataToSend.append("price", String(formData.price));
    dataToSend.append("deliveryTime", formData.deliveryTime);
    dataToSend.append("revisions", formData.revisions);
    dataToSend.append("description", formData.description);
    dataToSend.append("includes", JSON.stringify(formData.includes));
    if (formData.imageFile) {
      dataToSend.append("imageFile", formData.imageFile);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: dataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Service Published!",
          description: "Your service is now live on the marketplace.",
          className: "bg-green-600 text-white border-none"
        });
        // Short delay to let user see toast before redirect
        setTimeout(() => {
          navigate("/");
        }, 1500);

      } else {
        toast({
          title: "Error publishing service",
          description: result.message || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not connect to the server.",
        variant: "destructive"
      });
      console.error("Error de red:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">
          Offer a New Freelance Service
        </h1>

        {/* Indicador de Pasos (Componente Separado) */}
        <StepIndicator step={step} />

        <div
          className="rounded-xl border bg-white p-8 shadow-lg"
        >
          {renderStepContent()}

          {/* Controles de Navegación */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <Button
                onClick={() => {
                  if (canAdvance()) {
                    setStep(step + 1);
                  } else {
                    // Identify errors
                    const errors = [];
                    if (step === 1) {
                      if (formData.title.length < 5) errors.push("Title (min 5 chars)");
                      if (!formData.category) errors.push("Category");
                      if (Number(formData.price) <= 0) errors.push("Price (must be positive)");
                    } else if (step === 2) {
                      const wordCount = formData.description.split(/\s+/).filter(Boolean).length;
                      if (wordCount < 3) errors.push("Description (min 3 words)");
                      if (formData.description.length < 50) errors.push("Description (min 50 chars)");
                      if (!formData.imageFile) errors.push("Image");
                      if (formData.includes.length === 0) errors.push("At least one included item");
                    }

                    toast({
                      title: "Please complete the following:",
                      description: errors.join(", "),
                      variant: "destructive"
                    });
                  }
                }}
                type="button"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button" // Changed from submit to button to prevent auto-submission
                onClick={handlePublish}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                disabled={!canAdvance() || isSubmitting}
              >
                {isSubmitting ? "Publishing..." : "Publish Service Now!"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;
