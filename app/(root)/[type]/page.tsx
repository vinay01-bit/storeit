import React from "react";
import Sort from "@/components/Sort";
import { getFiles } from "@/lib/actions/file.actions";
import { Models } from "node-appwrite";
import Card from "@/components/Card";
import { getFileTypesParams } from "@/lib/utils";
import FileGrid from "@/components/FileGrid";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";

  const types = getFileTypesParams(type) as FileType[];

  const files = await getFiles({ types, searchText, sort });

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1 text-[#888888]">
            Total: <span className="h5 text-[#FF6666] font-bold">0 MB</span>
          </p>

          <div className="sort-container">
            <p className="text-sm hidden text-[#888888] sm:block">Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {/* Render the files */}
      {files.total > 0 ? (
        <FileGrid files={files.documents} path={`/${type}`} />
      ) : (
        <p className="empty-list text-[#666666]">No files uploaded</p>
      )}
    </div>
  );
};

export default Page;
