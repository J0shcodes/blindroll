import React from "react";
import { Card } from "@/components/Card";
import { Eye, TrendingDown, ShieldOff } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: Eye,
      title: "Visibility of Salaries",
      description: "All transaction details are public on-chain, exposing sensitive payroll information to anyone.",
    },
    {
      icon: TrendingDown,
      title: "Privacy Risks",
      description: "Employees lose financial privacy. Competitors can infer operational costs. Tax exposure.",
    },
    {
      icon: ShieldOff,
      title: "No Data Security",
      description: "Off-chain solutions require trusting intermediaries. On-chain systems lack confidentiality.",
    },
  ];

  return (
    <section className="py-20 border-t border-border-light">
      <div className="container-safe w-full space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-h1 font-bold text-text-primary">The Problem</h2>
          <p className="text-body text-text-secondary">
            Current payroll solutions expose sensitive data or sacrifice decentralization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <Card key={idx}>
                <Icon className="w-8 h-8 text-accent-purple mb-4" />
                <h3 className="text-h3 font-semibold text-text-primary mb-2">{problem.title}</h3>
                <p className="text-body text-text-secondary">{problem.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
