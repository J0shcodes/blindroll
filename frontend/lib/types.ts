/* Shared TypeScript interfaces and types for Blindroll UI */

export interface Employee {
  id: string;
  walletAddress: string;
  status: 'active' | 'inactive';
  salary: string; // encrypted
  balance: string; // encrypted
  addedDate: string;
  lastPayment?: string;
}

export interface PayrollStats {
  activeEmployees: number;
  treasuryBalance: string; // encrypted
  lastPayrollDate?: string;
  nextPayrollDate?: string;
}

export interface Activity {
  id: string;
  timestamp: string;
  type: 'payroll' | 'treasury' | 'employee' | 'salary' | 'settings';
  description: string;
  metadata?: Record<string, string>;
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  network: 'sepolia' | 'mainnet';
}

export interface EncryptionState {
  state: 'plaintext' | 'encrypting' | 'encrypted';
  plainvalue?: string;
  encryptedValue?: string;
  progress?: number;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  hover?: boolean;
}

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'default';
  children: React.ReactNode;
  className?: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  value: string | React.ReactNode;
  label: string;
  subtext?: string;
  className?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
}

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T;
  onRowClick?: (row: T) => void;
  className?: string;
}

export interface TimelineItemProps {
  timestamp: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  isLast?: boolean;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'employer' | 'employee';
  walletAddress: string;
}
