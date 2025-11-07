import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotesClient from "./NotesClient";
import { Header } from "../dashboard/page";

export default async function NotesPage() {
  const token = (await cookies()).get("sb_token")?.value;
  const decoded = token ? verifyToken<{ userId: string }>(token) : null;

  if (!decoded) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <NotesClient userId={decoded?.userId} />
    </>
  );
}
