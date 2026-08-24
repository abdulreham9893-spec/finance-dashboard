export interface CategoryInfo {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { name: "Salary", type: "INCOME", icon: "Wallet", color: "#10b981" },
  { name: "Freelance", type: "INCOME", icon: "Briefcase", color: "#3b82f6" },
  { name: "Investment", type: "INCOME", icon: "TrendingUp", color: "#8b5cf6" },
  { name: "Other Income", type: "INCOME", icon: "Plus", color: "#6366f1" },
  { name: "Housing", type: "EXPENSE", icon: "Home", color: "#ef4444" },
  { name: "Food", type: "EXPENSE", icon: "UtensilsCrossed", color: "#f97316" },
  { name: "Transportation", type: "EXPENSE", icon: "Car", color: "#eab308" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#8b5cf6" },
  { name: "Health", type: "EXPENSE", icon: "Heart", color: "#ef4444" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap", color: "#3b82f6" },
  { name: "Finance", type: "EXPENSE", icon: "Landmark", color: "#6366f1" },
  { name: "Other", type: "EXPENSE", icon: "MoreHorizontal", color: "#6b7280" },
];

export const INCOME_CATEGORIES = DEFAULT_CATEGORIES.filter((c) => c.type === "INCOME");
export const EXPENSE_CATEGORIES = DEFAULT_CATEGORIES.filter((c) => c.type === "EXPENSE");

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank transfer" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "DEBIT_CARD", label: "Debit card" },
  { value: "DIGITAL_WALLET", label: "Digital wallet" },
  { value: "OTHER", label: "Other" },
];

export const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
];

export const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

interface KeywordMap {
  [keyword: string]: string;
}

const EXPENSE_KEYWORDS: KeywordMap = {
  rent: "Housing",
  mortgage: "Housing",
  utilities: "Housing",
  electricity: "Housing",
  water: "Housing",
  internet: "Housing",
  wifi: "Housing",
  gas: "Housing",
  phone: "Housing",
  netflix: "Entertainment",
  spotify: "Entertainment",
  youtube: "Entertainment",
  disney: "Entertainment",
  hulu: "Entertainment",
  cinema: "Entertainment",
  movie: "Entertainment",
  game: "Entertainment",
  steam: "Entertainment",
  playstation: "Entertainment",
  xbox: "Entertainment",
  restaurant: "Food",
  food: "Food",
  groceries: "Food",
  grocery: "Food",
  mcdonald: "Food",
  starbucks: "Food",
  pizza: "Food",
  cafe: "Food",
  delivery: "Food",
  uber: "Transportation",
  lyft: "Transportation",
  taxi: "Transportation",
  fuel: "Transportation",
  petrol: "Transportation",
  gasStation: "Transportation",
  train: "Transportation",
  bus: "Transportation",
  metro: "Transportation",
  parking: "Transportation",
  car: "Transportation",
  repair: "Transportation",
  walmart: "Shopping",
  amazon: "Shopping",
  target: "Shopping",
  ebay: "Shopping",
  clothing: "Shopping",
  electronics: "Shopping",
  shoes: "Shopping",
  mall: "Shopping",
  zara: "Shopping",
  nike: "Shopping",
  pharmacy: "Health",
  medicine: "Health",
  doctor: "Health",
  hospital: "Health",
  gym: "Health",
  fitness: "Health",
  dentist: "Health",
  course: "Education",
  book: "Education",
  tuition: "Education",
  university: "Education",
  school: "Education",
  udemy: "Education",
  bank: "Finance",
  fee: "Finance",
  insurance: "Finance",
  loan: "Finance",
  interest: "Finance",
  investment: "Finance",
  tax: "Finance",
};

const INCOME_KEYWORDS: KeywordMap = {
  salary: "Salary",
  payroll: "Salary",
  paycheck: "Salary",
  wages: "Salary",
  freelance: "Freelance",
  contract: "Freelance",
  invoice: "Freelance",
  fiverr: "Freelance",
  upwork: "Freelance",
  dividend: "Investment",
  interest: "Investment",
  stock: "Investment",
  crypto: "Investment",
  refund: "Other Income",
  gift: "Other Income",
  bonus: "Other Income",
};

export function categorizeDescription(
  description: string,
  type: "INCOME" | "EXPENSE"
): string {
  const text = description.toLowerCase();
  const map = type === "INCOME" ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;

  for (const [keyword, category] of Object.entries(map)) {
    if (text.includes(keyword)) {
      return category;
    }
  }

  return type === "INCOME" ? "Other Income" : "Other";
}