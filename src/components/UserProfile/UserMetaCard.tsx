import { useState, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { UserProfile } from "../../services/user";

interface UserMetaCardProps {
  profile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => Promise<UserProfile>;
}

export default function UserMetaCard({ profile, onUpdate }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: profile.name || "",
    avatar: profile.avatar || "",
    avatarFile: null as File | null,
    avatarPreview: profile.avatar || "",
    social: {
      facebook: profile.social?.facebook || "https://facebook.com/",
      twitter: profile.social?.twitter || "https://twitter.com/",
      linkedin: profile.social?.linkedin || "https://linkedin.com/",
      instagram: profile.social?.instagram || "https://instagram.com/",
    },
  });
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Stop event propagation to prevent modal from closing
    e.stopPropagation();

    const file = e.target.files?.[0];
    setUploadError(null);

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size should be less than 5MB");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setFormData({
        ...formData,
        avatarFile: file,
        avatarPreview: previewUrl,
      });
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setUploadError(null);

      let avatarData = formData.avatar;

      // If there's a new file, convert to base64
      if (formData.avatarFile) {
        avatarData = await convertToBase64(formData.avatarFile);
      }

      await onUpdate({
        name: formData.name,
        avatar: avatarData,
        social: formData.social,
      });

      // Clean up preview URL
      if (formData.avatarPreview && formData.avatarPreview !== profile.avatar) {
        URL.revokeObjectURL(formData.avatarPreview);
      }

      closeModal();
    } catch (error) {
      console.error("Failed to update profile:", error);
      setUploadError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    // Stop propagation to prevent modal from closing
    e.stopPropagation();

    // Clean up preview URL
    if (formData.avatarPreview && formData.avatarPreview !== profile.avatar) {
      URL.revokeObjectURL(formData.avatarPreview);
    }

    setFormData({
      ...formData,
      avatar: "",
      avatarFile: null,
      avatarPreview: "",
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChooseImageClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent modal from closing
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    return profile.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCloseModal = () => {
    // Clean up preview URL if modal is closed without saving
    if (formData.avatarPreview && formData.avatarPreview !== profile.avatar) {
      URL.revokeObjectURL(formData.avatarPreview);
    }

    // Reset form data to original profile
    setFormData({
      name: profile.name || "",
      avatar: profile.avatar || "",
      avatarFile: null,
      avatarPreview: profile.avatar || "",
      social: {
        facebook: profile.social?.facebook || "https://facebook.com/",
        twitter: profile.social?.twitter || "https://twitter.com/",
        linkedin: profile.social?.linkedin || "https://linkedin.com/",
        instagram: profile.social?.instagram || "https://instagram.com/",
      },
    });
    setUploadError(null);
    closeModal();
  };

  // Prevent click events from bubbling up to the modal backdrop
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.classList.add(
                      "flex",
                      "items-center",
                      "justify-center",
                    );
                  }}
                />
              ) : (
                getInitials()
              )}
              <button
                onClick={openModal}
                className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition"
                title="Edit profile picture"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.role || "User"}
                </p>
                {profile.address?.city && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.address.city}, {profile.address.country}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* Social Links */}
              {profile.social?.facebook && (
                <a
                  href={profile.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              )}

              {profile.social?.twitter && (
                <a
                  href={profile.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              )}

              {profile.social?.linkedin && (
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              )}

              {profile.social?.instagram && (
                <a
                  href={profile.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463C18.3336 9.84055 18.3336 9.91888 18.3336 9.99972L18.3335 10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333C10.1594 18.333 10.0811 18.333 10.0002 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill="currentColor"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[700px] m-4"
      >
        {/* Add onClick handler to prevent backdrop clicks from closing */}
        <div onClick={handleModalContentClick}>
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Edit Profile Information
              </h4>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                Update your details to keep your profile up-to-date.
              </p>
            </div>

            {/* Upload Error Message */}
            {uploadError && (
              <div className="mb-4 px-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {uploadError}
                  </p>
                </div>
              </div>
            )}

            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                <div>
                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    Profile Picture
                  </h5>

                  <div className="mb-6">
                    <div className="flex items-center gap-6">
                      {/* Image Preview */}
                      <div className="relative w-24 h-24 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold">
                        {formData.avatarPreview ? (
                          <img
                            src={formData.avatarPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials()
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="avatar-upload"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleChooseImageClick}
                            type="button"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                          >
                            Choose Image
                          </button>

                          {formData.avatarPreview && (
                            <button
                              onClick={handleRemoveImage}
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg shadow-theme-xs hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Supported: JPG, PNG, GIF. Max size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    Basic Information
                  </h5>

                  <div className="space-y-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    Social Links
                  </h5>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    <div>
                      <Label>Facebook</Label>
                      <Input
                        type="text"
                        value={formData.social.facebook}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social: {
                              ...formData.social,
                              facebook: e.target.value,
                            },
                          })
                        }
                        placeholder="Facebook URL"
                      />
                    </div>

                    <div>
                      <Label>X (Twitter)</Label>
                      <Input
                        type="text"
                        value={formData.social.twitter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social: {
                              ...formData.social,
                              twitter: e.target.value,
                            },
                          })
                        }
                        placeholder="Twitter URL"
                      />
                    </div>

                    <div>
                      <Label>LinkedIn</Label>
                      <Input
                        type="text"
                        value={formData.social.linkedin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social: {
                              ...formData.social,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        placeholder="LinkedIn URL"
                      />
                    </div>

                    <div>
                      <Label>Instagram</Label>
                      <Input
                        type="text"
                        value={formData.social.instagram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social: {
                              ...formData.social,
                              instagram: e.target.value,
                            },
                          })
                        }
                        placeholder="Instagram URL"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseModal}
                  type="button"
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
}
