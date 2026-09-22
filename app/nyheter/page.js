import { redirect } from "next/navigation";

export default function NyheterPage() {
  redirect("/arkiv?nyhet=1");
}
