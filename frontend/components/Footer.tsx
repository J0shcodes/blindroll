import { Logo } from "./Logo";

export function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Security", href: "#" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Developers",
      links: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "GitHub", href: "#" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "Forum", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "License", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-bg-secondary border-t border-border-light py-20">
      <div className="container-safe w-full">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo size="lg" showText />
            <p className="text-body-sm text-text-secondary">Encrypted onchain payroll for Web3 teams</p>
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="text-body font-semibold text-text-primary">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-text-secondary">
          <p>© 2024 Blindroll. All rights reserved.</p>
          <p>
            Licensed under{" "}
            <a href="#" className="text-accent-purple hover:underline">
              GPL-3.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
