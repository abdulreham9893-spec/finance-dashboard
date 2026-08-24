import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create default categories
    const defaultCategories = [
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

    await db.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: user.id,
        isDefault: true,
      })),
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
