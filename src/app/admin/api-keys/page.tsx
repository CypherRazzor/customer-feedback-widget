import { redirect } from "next/navigation";
import { isAdminAuthorizedServer } from "@/lib/admin-auth";
import ApiKeysClient from "./ApiKeysClient";

export default function ApiKeysPage() {
  if (!isAdminAuthorizedServer()) {
    redirect("/admin/login");
  }

  return <ApiKeysClient />;
}
