import React from "react";
import { CheckCircle } from "lucide-react";

export function SecurityPropertiesSection() {
  const properties = [
    "End-to-end encrypted",
    "ACL-enforced access",
    "Inference-resistant",
    "Overflow-safe",
    "Open source",
  ];

  return (
    <section className="py-20 border-t border-border-light">
      <div className="container-safe w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-4">
            <h2 className="text-h1 font-bold text-text-primary leading-tight">Security Properties You Can Trust</h2>
            <p className="text-body text-text-secondary">Built on cryptographic principles, not promises</p>
          </div>

          {/* Right Column - Checkmarks */}
          <div className="space-y-4">
            {properties.map((prop, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-accent-green shrink-0" />
                <span className="text-body font-medium text-text-primary">{prop}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
