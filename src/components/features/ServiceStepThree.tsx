import { DollarSign, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StepThree = ({ formData }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">3. Review & Publish</h2>
      <div className="rounded-lg border p-6 bg-card shadow-sm">
        <h3 className="text-xl font-bold mb-4">Service Summary</h3>
        <div className="grid gap-6 md:grid-cols-2">

          {/* Left Col: Details */}
          <div className="space-y-4">
            <div>
              <p className="text-lg font-bold leading-tight">
                {formData.title || "Untitled Service"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Category: <span className="font-medium text-foreground">{formData.category || "Uncategorized"}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-y py-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Price</span>
                <div className="flex items-center gap-1 font-semibold">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {formData.price}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Delivery</span>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4" />
                  {formData.deliveryTime}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Revisions</span>
                <div className="flex items-center gap-1 font-medium">
                  <RefreshCw className="h-4 w-4" />
                  {formData.revisions}
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2 text-sm">Description Preview</p>
              <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                {formData.description || "No description provided."}
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2 text-sm">Includes</p>
              <div className="flex flex-wrap gap-2">
                {formData.includes.length > 0 ? (
                  formData.includes.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No items included.</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Image Preview */}
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">Cover Image</p>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              {formData.imageFile ? (
                <img
                  src={URL.createObjectURL(formData.imageFile)}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  No image uploaded
                </div>
              )}
            </div>
            {formData.imageFile && (
              <p className="text-xs text-muted-foreground text-center">
                {formData.imageFile.name}
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-center text-muted-foreground">
        By clicking "Publish", your service will be listed immediately.
      </p>
    </div>
  );
};

export default StepThree;
