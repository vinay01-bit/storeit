"use client";

import React, { useState } from "react";
import { Models } from "node-appwrite";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  softDeleteFile,
  updateFileUsers,
  renameFile,
} from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  files: Models.Document[];
  path: string;
}

const FileGrid = ({ files, path }: Props) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Modal states for bulk actions
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const showSuccessToast = (message: string) => {
    toast({
      description: (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#FF4444]" />
          <p className="body-2 text-white">{message}</p>
        </div>
      ),
      className:
        "bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl shadow-[0_0_20px_rgba(255,68,68,0.15)]",
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const file = files.find((f) => f.$id === id);
          if (!file) return Promise.resolve();
          return file.isDeleted
            ? deleteFile({
                fileId: file.$id,
                bucketFileId: file.bucketFileId,
                path,
              })
            : softDeleteFile({ fileId: file.$id, path });
        }),
      );
      showSuccessToast(`${selectedIds.length} files processed successfully`);
      setSelectedIds([]);
    } catch (error) {
      toast({
        description: "Bulk action failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkShare = async () => {
    if (selectedIds.length === 0 || emails.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const file = files.find((f) => f.$id === id);
          if (!file) return Promise.resolve();
          const mergedEmails = [
            ...new Set([...(file.users || []), ...emails]),
          ];
          return updateFileUsers({ fileId: file.$id, emails: mergedEmails, path });
        }),
      );
      showSuccessToast(`Shared with ${emails.length} users`);
      setIsShareModalOpen(false);
      setEmails([]);
      setSelectedIds([]);
    } catch (error) {
      toast({ description: "Bulk share failed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRename = async () => {
    if (selectedIds.length === 0 || !newName) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id, index) => {
          const file = files.find((f) => f.$id === id);
          if (!file) return Promise.resolve();
          // Adding a number suffix for bulk rename to avoid duplicate names
          const nameWithSuffix =
            selectedIds.length > 1 ? `${newName}_${index + 1}` : newName;
          return renameFile({
            fileId: file.$id,
            name: nameWithSuffix,
            extension: file.extension,
            path,
          });
        }),
      );
      showSuccessToast(`${selectedIds.length} files renamed successfully`);
      setIsRenameModalOpen(false);
      setNewName("");
      setSelectedIds([]);
    } catch (error) {
      toast({ description: "Bulk rename failed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <section className="file-list">
        {files.map((file) => (
          <div key={file.$id} className="relative group">
            <div
              className="absolute top-4 left-4 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(file.$id)}
                onChange={() => toggleSelection(file.$id)}
                className="size-5 cursor-pointer accent-[#FF4444] rounded border-[#2A2A2A] bg-[#1A1A1A] transition-all group-hover:opacity-100 opacity-0 checked:opacity-100"
              />
            </div>
            <Card file={file} />
          </div>
        ))}
      </section>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-full shadow-[0_0_40px_rgba(255,68,68,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="body-2 text-white font-bold whitespace-nowrap">
            {selectedIds.length} Selected
          </p>
          <div className="w-px h-6 bg-[#2A2A2A]" />

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-transparent text-[#888888] hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-all px-4 py-2 rounded-full border-none h-auto flex flex-col items-center gap-1"
            >
              <Image
                src="/assets/icons/share.svg"
                alt="share"
                width={20}
                height={20}
                className="invert"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Share
              </span>
            </Button>

            <Button
              onClick={() => setIsRenameModalOpen(true)}
              className="bg-transparent text-[#888888] hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-all px-4 py-2 rounded-full border-none h-auto flex flex-col items-center gap-1"
            >
              <Image
                src="/assets/icons/edit.svg"
                alt="rename"
                width={20}
                height={20}
                className="invert"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Rename
              </span>
            </Button>

            <Button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-transparent text-[#888888] hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-all px-4 py-2 rounded-full border-none h-auto flex flex-col items-center gap-1"
            >
              {isLoading ? (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
              ) : (
                <Image
                  src="/assets/icons/delete.svg"
                  alt="delete"
                  width={20}
                  height={20}
                  className="invert"
                />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {files[0]?.isDeleted ? "Delete" : "Trash"}
              </span>
            </Button>
          </div>

          <div className="w-px h-6 bg-[#2A2A2A]" />

          <Button
            onClick={() => setSelectedIds([])}
            className="text-[#666666] hover:text-white transition-all bg-transparent border-none px-2"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              Bulk Share Files
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="subtitle-2 text-[#888888]">
              Enter email addresses separated by commas to share all selected
              files.
            </p>
            <Input
              type="email"
              placeholder="email1@example.com, email2@example.com"
              onChange={(e) =>
                setEmails(e.target.value.trim().split(",").filter(Boolean))
              }
              className="share-input-field"
            />
          </div>
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button
              onClick={() => setIsShareModalOpen(false)}
              className="modal-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkShare}
              disabled={isLoading || emails.length === 0}
              className="modal-submit-button"
            >
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin mr-2"
                />
              )}
              Share with {selectedIds.length} Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              Bulk Rename Files
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="subtitle-2 text-[#888888]">
              Enter a base name. Selected files will be renamed with numerical
              suffixes.
            </p>
            <Input
              type="text"
              placeholder="Enter new base name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="share-input-field"
            />
          </div>
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button
              onClick={() => setIsRenameModalOpen(false)}
              className="modal-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRename}
              disabled={isLoading || !newName}
              className="modal-submit-button"
            >
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin mr-2"
                />
              )}
              Rename {selectedIds.length} Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileGrid;
