"use server";

import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import { Separator } from "@/components/ui/separator";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import { getUser } from "@/lib/db";
import { getApplication, getApplicationInterests } from "@/lib/application";
import {
  addInterviewComment,
  getInterview,
  updateInterview,
} from "@/lib/interview";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function InterviewPage({ params }: any) {
  const { id } = await params;

  async function handleContentSave(content: any) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // CHANGE ROLE
    // if (session?.user.role !== "recruiter") redirect("/");

    await updateInterview(id, content);

    return true;
  }

  async function handleCommentSave(content: string) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // CHANGE ROLE
    // if (session?.user.role !== "recruiter") redirect("/");

    return await addInterviewComment(
      session ? session.user.id : "",
      content,
      id,
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const candidate = await getUser(id);
  const application = await getApplication(candidate?.id);
  const applicationInterests = await getApplicationInterests(application);
  const comments = [];

  const interview = await getInterview(id);

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="mx-16 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <CandidateQuickInfo
                candidate={candidate}
                application={application}
                applicationInterests={applicationInterests}
              />

              <CandidateComments
                comments={comments}
                saveToDatabase={handleCommentSave}
              />
            </div>

            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Editor de Texto
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <div className="space-y-4 h-full flex flex-col">
                    <RealTimeEditor
                      roomId={`interview-${id}`}
                      websocketUrl="ws://0.0.0.0:1234"
                      userName={session ? session.user.name : ""}
                      interview={interview}
                      saveHandler={handleContentSave}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
