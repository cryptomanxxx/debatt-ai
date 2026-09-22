import { permanentRedirect } from "next/navigation";

export default function NyheterPage() {
  permanentRedirect("/arkiv?nyhet=1");
}
