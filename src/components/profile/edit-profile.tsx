import { getFilenameUrl } from "@/lib/file-upload";
import { EditProfileImage } from "./edit-profile-image";
import { ResetPassword } from "./reset-password";
import { EditProfileName } from "./edit-profile-name";

interface EditProfileProps {
  pictureUrl: string | null;
}

export default async function EditProfile({ pictureUrl }: EditProfileProps) {
  const getSignedPictureUrl = async (pictureUrl: string) => {
    "use server";

    return await getFilenameUrl(pictureUrl);
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
