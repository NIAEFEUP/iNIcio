import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/final-messages";
import { headers } from "next/headers";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import { CheckCircle2, Clock } from "lucide-react";

export default async function ResultPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const result = await getMessage(session!.user.id);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="rounded-2xl shadow-2xl overflow-hidden border-t-8 border-gray-300 bg-gradient-to-br from-gray-50 to-white">
            <div className="p-8 sm:p-12 text-center">
              <Clock className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-gray-700 mb-2">
                Resultado pendente
              </h1>
              <p className="text-gray-500">
                O resultado da tua candidatura ainda não foi decidido. Verifica
                novamente mais tarde.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = result.message.content as Array<any>;
  const isApproved = result.decision === "approved";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div
          className={`rounded-2xl shadow-2xl overflow-hidden border-t-8 ${
            isApproved
              ? "border-green-500 bg-gradient-to-br from-green-50 to-white"
              : "border-red-500 bg-gradient-to-br from-red-50 to-white"
          }`}
        >
          <div className="p-8 sm:p-12">
            <div className="flex items-center justify-center mb-8">
              <div className="flex flex-col items-center">
                {isApproved ? (
                  <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                ) : (
                  <div></div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200">
              <ReadOnlyBlocks blocks={content} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
