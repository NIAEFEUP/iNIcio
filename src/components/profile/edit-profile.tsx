import { fromFullUrlToPath, getFilenameUrl } from "@/lib/file-upload";
import { EditProfileImage } from "./edit-profile-image";
import { ResetPassword } from "./reset-password";
import { getSessionUser } from "@/lib/action-guard";
import { EditProfileName } from "./edit-profile-name";

interface EditProfileProps {
  pictureUrl: string | null;
}

export default async function EditProfile({ pictureUrl }: EditProfileProps) {
  const getSignedPictureUrl = async (targetPictureUrl: string) => {
    "use server";

    const user = await getSessionUser();
    const cleanPath = fromFullUrlToPath(targetPictureUrl);

    if (
      !cleanPath.startsWith(`profiles/${user.id}/`) &&
      targetPictureUrl !== user.image
    ) {
      throw new Error("Unauthorized access to image file");
    }

    return await getFilenameUrl(targetPictureUrl);
  };

  return (
    <div className="space-y-4">
      <EditProfileImage
        getSignedPictureUrl={getSignedPictureUrl}
        currentPicture={pictureUrl}
      />
      <EditProfileName />
      <ResetPassword />
    </div>
  );
}
