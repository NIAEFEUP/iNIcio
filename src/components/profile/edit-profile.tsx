import { getFilenameUrl } from "@/lib/file-upload";
import { EditProfileImage } from "./edit-profile-image";
import { ResetPassword } from "./reset-password";

interface EditProfileProps {
  pictureUrl: string | null;
}

export default async function EditProfile({ pictureUrl }: EditProfileProps) {
  const getSignedPictureUrl = async (pictureUrl: string) => {
    "use server";

    return await getFilenameUrl(pictureUrl);
  };

  return (
    <>
      <EditProfileImage
        getSignedPictureUrl={getSignedPictureUrl}
        currentPicture={pictureUrl}
      />
      <ResetPassword />
    </>
  );
}
