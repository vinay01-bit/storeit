import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const ImageThumbnail = ({ file }: { file: Models.Document }) => (
  <div className="file-details-thumbnail">
    <Thumbnail type={file.type} extension={file.extension} url={file.url} />
    <div className="flex flex-col">
      <p className="subtitle-2 mb-1">{file.name}</p>
      <FormattedDateTime date={file.$createdAt} className="caption" />
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex">
    <p className="file-details-label text-left">{label}</p>
    <p className="file-details-value text-left">{value}</p>
  </div>
);

export const FileDetails = ({ file }: { file: Models.Document }) => {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={convertFileSize(file.size)} />
        <DetailRow label="Owner:" value={file.owner.fullName} />
        <DetailRow label="Last edit:" value={formatDateTime(file.$updatedAt)} />
      </div>
    </>
  );
};

interface Props {
  file: Models.Document;
  onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
  onRemove: (email: string) => void;
}

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-[#888888]">
          Share file with other users
        </p>
        <div className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            onChange={(e) => {
              const typed = e.target.value.trim().split(",").filter(Boolean);
              const merged = [...new Set([...(file.users || []), ...typed])];
              onInputChange(merged);
            }}
            className="share-input-field"
          />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(file.url);
            }}
            className="flex items-center gap-2 bg-[#FF4444]/10 text-[#FF4444] hover:bg-[#FF4444]/20 border border-[#FF4444]/20 h-10 rounded-xl transition-all"
          >
            <Image
              src="/assets/icons/share.svg"
              alt="copy"
              width={20}
              height={20}
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(35%) sepia(85%) saturate(3065%) hue-rotate(345deg) brightness(97%) contrast(93%)",
              }}
            />
            Copy Public Link
          </Button>
        </div>
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-[#888888]">Shared with</p>
            <p className="subtitle-2 text-[#666666]">
              {file.users.length} users
            </p>
          </div>

          <ul className="pt-2">
            {file.users.map((email: string) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2"
              >
                <p className="subtitle-2">{email}</p>
                <Button
                  onClick={() => onRemove(email)}
                  className="share-remove-user"
                >
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="Remove"
                    width={24}
                    height={24}
                    className="remove-icon"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
