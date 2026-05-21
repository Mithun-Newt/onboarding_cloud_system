import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  console.log("REAL API ROUTE HIT");
  try {
    console.log("CHANGE PASSWORD API HIT");

    const session = await getServerSession(authOptions);

    console.log("SESSION:", session);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } =
      await req.json();

    console.log("BODY:", {
      currentPassword,
      newPassword,
    });

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both passwords are required" },
        { status: 400 }
      );
    }

    const user = await prisma.staffUser.findUnique({
      where: {
        id: session.user.id,
      },
    });

    console.log("USER:", user);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    console.log("PASSWORD VALID:", valid);

    if (!valid) {
      return NextResponse.json(
        { error: "Current password incorrect" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(
      newPassword,
      12
    );

    console.log("NEW HASH:", hash);

    const updatedUser =
      await prisma.staffUser.update({
        where: {
          id: user.id,
        },

        data: {
          passwordHash: hash,
          mustChangePassword: false,
        },
      });

    console.log(
      "UPDATED USER:",
      updatedUser
    );

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}