import { Card } from "@/components/Card";
import { Zap, Users } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "For DAOs & Web3 Teams",
      description: "Manage contributor compensation privately. No external intermediaries. Self-custodial payments.",
    },
    {
      icon: Users,
      title: "Privacy-First Architecture",
      description: "Salaries, payments, and access controls are cryptographically sealed. Teams control their data.",
    },
  ];

  return (
    <section className="py-20 border-t border-border-light">
      <div className="container-safe w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-h1 font-bold text-text-primary">Built for Web3</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx}>
                <Icon className="w-10 h-10 text-accent-purple mb-4" />
                <h3 className="text-h3 font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-body text-text-secondary">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
