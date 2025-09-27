"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ProfileImageUpload } from "../ui/profile-image-upload";

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onPictureChange?: (file: File | null) => void;
  getSignedPictureUrl?: (pictureUrl: string) => Promise<string>;
  className?: string;
}

export function EditProfileImage({
  currentPicture = "/student-avatar.png",
  onPictureChange,
  getSignedPictureUrl,
  className,
}: ProfilePictureUploadProps) {
  const { data: session } = authClient.useSession();

  const [previewUrl, setPreviewUrl] = useState<string>(currentPicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSuccess = async (result: {
    fileName: string;
    url: string;
  }) => {
    setPreviewUrl(await getSignedPictureUrl(result.url));
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Foto de Perfil
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-primary/10 ring-offset-4 ring-offset-background">
              <AvatarImage
                src={previewUrl || "/placeholder.svg"}
                alt={session?.user?.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-semibold">
                {session?.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <ProfileImageUpload
          onSuccess={handleUploadSuccess}
          onError={() => {}}
        />

        <div className="flex gap-3">
          <Button
            onClick={triggerFileInput}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Upload className="h-4 w-4 mr-2" />
            Escolher Ficheiro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
