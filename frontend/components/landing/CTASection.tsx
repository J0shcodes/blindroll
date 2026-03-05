import { Button } from "@/components/Button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 border-t border-border-light">
      <div className="container-safe w-full text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-h1 font-bold text-text-primary">Ready to get started?</h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto">
            Deploy encrypted payroll on Ethereum Sepolia today. No signup required.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/connect">
            <Button variant="primary" size="lg">Launch App</Button>
          </Link>
          <a href="https://github.com/J0shcodes/blindroll" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg">View on GitHub</Button>
          </a>
        </div>

        <p className="text-text-tertiary text-body-sm pt-4">Open source · Testnet · No signup required</p>
      </div>
    </section>
  );
}
