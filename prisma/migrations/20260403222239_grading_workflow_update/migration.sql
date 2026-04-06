/*
  Warnings:

  - You are about to drop the column `submissionFileId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `submissionFileName` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `submittedDate` on the `Assignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "submissionFileId",
DROP COLUMN "submissionFileName",
DROP COLUMN "submittedDate",
ADD COLUMN     "submissionReceivedDate" TIMESTAMP(3);
