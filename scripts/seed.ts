import { db } from "@/lib/db";
import { users, workspaces, messages, studySessions, matches, notes, flashcards } from "@/lib/schema";

async function main() {
  // users
  const [sarah, alex, emma] = await Promise.all([
    db.insert(users).values({ name: "Sarah Johnson", email: "sarah@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" }).returning().then(r=>r[0]),
    db.insert(users).values({ name: "Alex Chen", email: "alex@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" }).returning().then(r=>r[0]),
    db.insert(users).values({ name: "Emma Rodriguez", email: "emma@uni.edu", passwordHash: "$2b$10$k6c6C8YkX2xYb9S8bS3cseGmR1lZ1o7bX3gT8mFjWQ2mGQwzWfC3i" }).returning().then(r=>r[0]),
  ]);

  const [ws] = await db.insert(workspaces).values([{ title: "AI Study Group" }]).returning();

  await db.insert(messages).values([
    { userId: sarah.id, workspaceId: ws.id, content: "Welcome to AI Study Group!" },
    { userId: alex.id, workspaceId: ws.id, content: "Kickoff at 6 PM." },
  ]);

  await db.insert(studySessions).values([
    { userId: sarah.id, durationHours: 6 },
    { userId: sarah.id, durationHours: 18 },
  ]);

  await db.insert(matches).values([
    { partnerName: "Alex Chen", subtitle: "JavaScript, React, Node.js • 85% match", avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=128&auto=format&fit=crop" },
    { partnerName: "Emma Rodriguez", subtitle: "Python, Machine Learning • 75% match", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop" },
    { partnerName: "Ravi Kumar", subtitle: "Databases, SQL • 68% match", avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=128&auto=format&fit=crop" },
  ]);

  // Note + flashcards
  const [note] = await db.insert(notes).values({ userId: sarah.id, title: "Intro to AI", sourceType: "text", rawText: "Artificial Intelligence is the simulation of human intelligence processes by machines. Machine Learning is a subset of AI. Neural networks are inspired by biological neurons." }).returning();
  const text = note.rawText || "";
  const sentences = text.split(/[\.\n]/).map(s=>s.trim()).filter(Boolean);
  const gens = sentences.slice(0,6).map(s => ({ front: s.length>50 ? s.slice(0,50)+'...' : s, back: s }));
  for(const c of gens){
    await db.insert(flashcards).values({ noteId: note.id, userId: sarah.id, front: c.front, back: c.back });
  }

  console.log("Seeded. Login with sarah@uni.edu / password");
}

main().then(()=>process.exit(0));
