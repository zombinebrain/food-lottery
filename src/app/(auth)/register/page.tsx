import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация — Food Lottery",
};

export default function RegisterPage() {
  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Создать аккаунт</h2>
      <RegisterForm />
    </>
  );
}
