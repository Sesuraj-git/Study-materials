import { db } from "@/lib/db";
import { users, workspaces, messages, studySessions, matches } from "@/lib/schema";

async function main() {
  await db.insert(users).values([
    { name: "Sarah Johnson", email: "sarah@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" }, // 'password'
    { name: "Alex Chen", email: "alex@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" },
    { name: "Emma Rodriguez", email: "emma@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" },
  ]);

  const [ws] = await db.insert(workspaces).values([{ title: "AI Study Group" }]).returning();

  await db.insert(messages).values([
    { userId: null, workspaceId: ws.id, content: "Welcome to AI Study Group!" },
    { userId: null, workspaceId: ws.id, content: "Kickoff at 6 PM." },
  ]);

  await db.insert(studySessions).values([
    { userId: null, durationHours: 6 },
    { userId: null, durationHours: 18 },
  ]);

  await db.insert(matches).values([
    { partnerName: "Alex Chen", subtitle: "JavaScript, React, Node.js • 85% match", avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=128&auto=format&fit=crop" },
    { partnerName: "Emma Rodriguez", subtitle: "Python, Machine Learning • 75% match", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop" },
    { partnerName: "Ravi Kumar", subtitle: "Databases, SQL • 68% match", avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=128&auto=format&fit=crop" },
  ]);

  console.log("Seeded (default password for all users is 'password')");
}

main().then(()=>process.exit(0));
