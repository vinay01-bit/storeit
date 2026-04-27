"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Image from "next/image";
import { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  renameFile,
  toggleFavorite,
  updateFileUsers,
  softDeleteFile,
  restoreFile,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import { useToast } from "@/hooks/use-toast";

const ActionDropdown = ({ file }: { file: Models.Document }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>(file.users || []);

  const path = usePathname();
  const { toast } = useToast();

  const showToast = (type: "success" | "error", message: string) => {
    toast({
      description: (
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              type === "success" ? "bg-[#FF4444]" : "bg-red-700"
            }`}
          />
          <p className="body-2 text-white">{message}</p>
        </div>
      ),
      className:
        "bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl shadow-[0_0_20px_rgba(255,68,68,0.15)]",
    });
  };

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
    setEmails(file.users || []);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    let success = false;

    const actions = {
      rename: () =>
        renameFile({ fileId: file.$id, name, extension: file.extension, path }),
      share: () => updateFileUsers({ fileId: file.$id, emails, path }),
      delete: () => {
        if (file.isDeleted) {
          return deleteFile({
            fileId: file.$id,
            bucketFileId: file.bucketFileId,
            path,
          });
        } else {
          return softDeleteFile({ fileId: file.$id, path });
        }
      },
      restore: () => restoreFile({ fileId: file.$id, path }),
      favorite: () =>
        toggleFavorite({
          fileId: file.$id,
          starred: !file.starred,
          path,
        }),
    };

    if (action.value === "shareLink") {
      navigator.clipboard.writeText(file.url);
      showToast("success", "Public link copied to clipboard!");
      setIsLoading(false);
      closeAllModals();
      return;
    }

    const actionFn = actions[action.value as keyof typeof actions];
    if (actionFn) {
      success = await actionFn();
    }

    if (success) {
      const messages: Record<string, string> = {
        rename: `"${name}" renamed successfully`,
        share: `File shared with ${emails.length} user${emails.length !== 1 ? "s" : ""}`,
        delete: file.isDeleted
          ? `"${file.name}" permanently deleted`
          : `"${file.name}" moved to Recycle Bin`,
        restore: `"${file.name}" restored successfully`,
        favorite: file.starred
          ? `"${file.name}" removed from starred`
          : `"${file.name}" added to starred`,
      };
      showToast("success", messages[action.value] || "Action completed");
      closeAllModals();
    } else if (action.value !== "shareLink") {
      showToast("error", "Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  const handleRemoveUser = async (email: string) => {
    const updatedEmails = emails.filter((e) => e !== email);

    const success = await updateFileUsers({
      fileId: file.$id,
      emails: updatedEmails,
      path,
    });

    if (success) {
      setEmails(updatedEmails);
      showToast("success", `${email} removed from shared users`);
    }
    closeAllModals();
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-white">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              {file.isDeleted
                ? `Are you sure you want to PERMANENTLY delete `
                : `Are you sure you want to move to Recycle Bin `}
              <span className="delete-file-name">{file.name}</span>?
            </p>
          )}
          {value === "restore" && (
            <p className="delete-confirmation">
              Restore <span className="delete-file-name">{file.name}</span> to
              your files?
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share", "restore"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  // Filter actions based on file state (deleted or not)
  const filteredActions = actionsDropdownItems.filter((actionItem) => {
    if (file.isDeleted) {
      return ["restore", "delete", "details"].includes(actionItem.value);
    }
    return !["restore"].includes(actionItem.value);
  });

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate text-white">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filteredActions.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);

                if (
                  ["rename", "share", "delete", "details", "restore"].includes(
                    actionItem.value,
                  )
                ) {
                  setIsModalOpen(true);
                } else if (actionItem.value === "shareLink") {
                  handleAction();
                } else if (actionItem.value === "favorite") {
                  toggleFavorite({
                    fileId: file.$id,
                    starred: !file.starred,
                    path,
                  }).then((result) => {
                    if (result) {
                      showToast(
                        "success",
                        file.starred
                          ? `"${file.name}" removed from starred`
                          : `"${file.name}" added to starred ⭐`,
                      );
                    }
                  });
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={constructDownloadUrl(file.bucketFileId)}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};
export default ActionDropdown;
