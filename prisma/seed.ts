import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@financeai.app";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo User";

interface CategoryInfo {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: CategoryInfo[] = [
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

const MERCHANTS: Record<string, string[]> = {
  Food: [
    "Whole Foods Market",
    "Trader Joe's",
    "Chipotle",
    "Starbucks",
    "Local Bistro",
    "Safeway",
    "DoorDash",
  ],
  Transportation: [
    "Shell Gas Station",
    "Uber",
    "Lyft",
    "Metro Card",
    "Parking Garage",
  ],
  Shopping: ["Amazon", "Target", "Best Buy", "Nike Store", "Zara", "IKEA"],
  Entertainment: ["Netflix", "Spotify", "AMC Theaters", "Steam", "Concert Tickets"],
  Health: ["CVS Pharmacy", "Walgreens", "Gym Membership", "Dr. Smith Clinic"],
  Education: ["Coursera", "Udemy", "Bookstore"],
  Housing: ["Rent Payment", "Electric Bill", "Water Bill", "Internet Bill"],
  Finance: ["Bank Fee", "Investment Fee"],
};

const randomAmount = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("Seeding database...");

  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log("Demo user already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      password: passwordHash,
      currency: "USD",
      onboarded: true,
    },
  });

  const categoryMap: Record<string, string> = {};
  for (const c of DEFAULT_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      },
    });
    categoryMap[c.name] = created.id;
  }

  const now = new Date();
  const transactions = [];

  const incomeDescriptions = [
    { category: "Salary", merchant: "Acme Corp", amount: [4200, 4600] },
    { category: "Freelance", merchant: "Upwork", amount: [300, 900] },
    { category: "Investment", merchant: "Dividends", amount: [40, 120] },
  ];

  for (let month = 0; month < 6; month++) {
    for (const inc of incomeDescriptions) {
      transactions.push({
        userId: user.id,
        amount: randomAmount(inc.amount[0], inc.amount[1]),
        type: "INCOME",
        description: inc.merchant,
        merchant: inc.merchant,
        categoryId: categoryMap[inc.category],
        paymentMethod: "BANK",
        date: new Date(
          now.getFullYear(),
          now.getMonth() - month,
          month === 0 ? 1 : Math.min(5, 28)
        ),
        isRecurring: true,
        currency: "USD",
      });
    }

    for (const [category, merchantList] of Object.entries(MERCHANTS)) {
      const monthLength = month === 0 ? Math.max(1, now.getDate()) : 28;
      const frequency: Record<string, number> = {
        Food: 1,
        Transportation: 2,
        Shopping: 3,
        Entertainment: 4,
        Health: 14,
        Education: 20,
        Finance: 20,
      };
      const step = frequency[category] ?? 5;
      for (let day = step; day <= monthLength; day += step) {
        transactions.push({
          userId: user.id,
          amount: randomAmount(
            category === "Housing" ? 60 : category === "Food" ? 8 : 5,
            category === "Housing" ? 900 : category === "Food" ? 65 : 200
          ),
          type: "EXPENSE",
          description: pick(merchantList),
          merchant: pick(merchantList),
          categoryId: categoryMap[category],
          paymentMethod: pick(["DEBIT_CARD", "CREDIT_CARD", "DIGITAL_WALLET", "CASH"]),
          date: new Date(now.getFullYear(), now.getMonth() - month, day),
          currency: "USD",
        });
      }
    }

    const rentDay = 1;
    transactions.push({
      userId: user.id,
      amount: 1500,
      type: "EXPENSE",
      description: "Rent Payment",
      merchant: "Rent Payment",
      categoryId: categoryMap.Housing,
      paymentMethod: "BANK",
      date: new Date(now.getFullYear(), now.getMonth() - month, rentDay),
      isRecurring: true,
      currency: "USD",
    });
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log(`Created ${transactions.length} transactions`);

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: categoryMap.Food, amount: 450, period: "MONTHLY" },
      { userId: user.id, categoryId: categoryMap.Transportation, amount: 250, period: "MONTHLY" },
      { userId: user.id, categoryId: categoryMap.Shopping, amount: 300, period: "MONTHLY" },
      { userId: user.id, categoryId: categoryMap.Entertainment, amount: 150, period: "MONTHLY" },
    ],
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        name: "Emergency Fund",
        targetAmount: 10000,
        currentAmount: 6800,
        icon: "PiggyBank",
        color: "#10b981",
        description: "6 months of living expenses",
        targetDate: new Date(now.getFullYear() + 1, 5, 30),
      },
      {
        userId: user.id,
        name: "New Laptop",
        targetAmount: 2000,
        currentAmount: 1250,
        icon: "Laptop",
        color: "#3b82f6",
        targetDate: new Date(now.getFullYear(), 11, 31),
      },
      {
        userId: user.id,
        name: "Trip to Japan",
        targetAmount: 3500,
        currentAmount: 900,
        icon: "Plane",
        color: "#8b5cf6",
        description: "2-week trip for two",
        targetDate: new Date(now.getFullYear() + 1, 2, 15),
      },
    ],
  });

  await prisma.recurringTransaction.createMany({
    data: [
      {
        userId: user.id,
        description: "Rent",
        amount: 1500,
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        categoryId: categoryMap.Housing,
      },
      {
        userId: user.id,
        description: "Salary",
        amount: 4400,
        type: "INCOME",
        frequency: "MONTHLY",
        nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        categoryId: categoryMap.Salary,
      },
      {
        userId: user.id,
        description: "Netflix",
        amount: 15.99,
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 12),
        categoryId: categoryMap.Entertainment,
      },
      {
        userId: user.id,
        description: "Spotify",
        amount: 11.99,
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 18),
        categoryId: categoryMap.Entertainment,
      },
      {
        userId: user.id,
        description: "Gym Membership",
        amount: 49,
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        categoryId: categoryMap.Health,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "AI_INSIGHT",
        title: "Savings opportunity",
        message: "You spent 18% more on dining out this month. Consider setting a weekly limit.",
        read: false,
        actionUrl: "/analytics",
      },
      {
        userId: user.id,
        type: "GOAL_MILESTONE",
        title: "Goal update",
        message: "You're 68% of the way to your Emergency Fund goal. Keep going!",
        read: false,
        actionUrl: "/goals",
      },
      {
        userId: user.id,
        type: "RECURRING_REMINDER",
        title: "Upcoming payment",
        message: "Rent of $1,500 is due on the 1st.",
        read: false,
        actionUrl: "/settings",
      },
    ],
  });

  await prisma.aIInsight.createMany({
    data: [
      {
        userId: user.id,
        type: "SPENDING_SUMMARY",
        title: "Monthly spending overview",
        content:
          "Your average monthly spending is $2,850, with Food (28%) and Housing (52%) as the largest categories.",
        period: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      },
      {
        userId: user.id,
        type: "SAVING_OPPORTUNITY",
        title: "Reduce food delivery",
        content:
          "You spent $210 on DoorDash last month. Cooking 3 more meals per week could save around $90/month.",
        period: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      },
      {
        userId: user.id,
        type: "POSITIVE_HABIT",
        title: "Consistent savings",
        content:
          "You saved $640 last month (14% of income), beating your 10% target. Great consistency!",
        period: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      },
    ],
  });

  console.log("Seed complete!");
  console.log("");
  console.log(`Demo login:  ${DEMO_EMAIL}`);
  console.log(`Password:    ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
