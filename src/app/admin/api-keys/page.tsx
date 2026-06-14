import { redirect } from "next/navigation";
import { isAdminAuthorizedServer } from "@/lib/admin-auth";
import ApiKeysClient from "./ApiKeysClient";

export default async function ApiKeysPage() {
  if (!(await isAdminAuthorizedServer())) {
    redirect("/admin/login");
  }

  return <ApiKeysClient />;
}
